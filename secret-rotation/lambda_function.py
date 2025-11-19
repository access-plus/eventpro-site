import json
import os
import string
import secrets as py_secrets

import boto3
import psycopg2
from psycopg2 import sql

secrets_client = boto3.client("secretsmanager")

PASSWORD_CHARS = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{}"


def lambda_handler(event, context):
    """
    Entry point for AWS Secrets Manager rotation.
    Event:
      - SecretId
      - ClientRequestToken
      - Step: createSecret | setSecret | testSecret | finishSecret
    """
    arn = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    metadata = secrets_client.describe_secret(SecretId=arn)
    versions = metadata["VersionIdsToStages"]

    if token not in versions:
        raise ValueError(f"Secret version {token} not found for {arn}")

    if "AWSCURRENT" in versions[token]:
        print(f"Version {token} already AWSCURRENT for {arn}")
        return

    if step == "createSecret":
        create_secret(arn, token)
    elif step == "setSecret":
        set_secret(arn, token)
    elif step == "testSecret":
        test_secret(arn, token)
    elif step == "finishSecret":
        finish_secret(arn, token)
    else:
        raise ValueError(f"Invalid step: {step}")


def create_secret(arn: str, token: str) -> None:
    # If AWSPENDING already exists, do nothing
    try:
        secrets_client.get_secret_value(
            SecretId=arn,
            VersionId=token,
            VersionStage="AWSPENDING",
        )
        print("createSecret: AWSPENDING already exists; skipping.")
        return
    except secrets_client.exceptions.ResourceNotFoundException:
        pass

    current = get_secret_dict(arn, "AWSCURRENT")
    new_password = generate_password(32)
    pending = dict(current)
    pending["password"] = new_password

    secrets_client.put_secret_value(
      SecretId=arn,
      ClientRequestToken=token,
      SecretString=json.dumps(pending),
      VersionStages=["AWSPENDING"],
    )
    print("createSecret: Created AWSPENDING with new password.")


def set_secret(arn: str, token: str) -> None:
    current = get_secret_dict(arn, "AWSCURRENT")
    pending = get_secret_dict(arn, "AWSPENDING", token)

    conn = get_connection(current)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            query = sql.SQL("ALTER ROLE {user} WITH PASSWORD %s;").format(
                user=sql.Identifier(pending["username"])
            )
            cur.execute(query, (pending["password"],))
        print("setSecret: Updated DB password.")
    finally:
        conn.close()


def test_secret(arn: str, token: str) -> None:
    pending = get_secret_dict(arn, "AWSPENDING", token)
    conn = get_connection(pending)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            cur.fetchone()
        print("testSecret: Connection successful with AWSPENDING.")
    finally:
        conn.close()


def finish_secret(arn: str, token: str) -> None:
    metadata = secrets_client.describe_secret(SecretId=arn)
    versions = metadata["VersionIdsToStages"]

    current_version = None
    for version_id, stages in versions.items():
        if "AWSCURRENT" in stages:
            current_version = version_id
            break

    if current_version == token:
        print("finishSecret: Already AWSCURRENT; nothing to do.")
        return

    print(f"finishSecret: Promoting {token} to AWSCURRENT.")
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version,
    )


def generate_password(length: int = 32) -> str:
    return "".join(py_secrets.choice(PASSWORD_CHARS) for _ in range(length))


def get_secret_dict(arn: str, stage: str, version_id: str | None = None) -> dict:
    kwargs = {
        "SecretId": arn,
        "VersionStage": stage,
    }
    if version_id:
        kwargs["VersionId"] = version_id

    resp = secrets_client.get_secret_value(**kwargs)
    return json.loads(resp["SecretString"])


def get_connection(secret: dict):
    host = secret["host"]
    port = secret.get("port", 5432)
    dbname = secret["dbname"]
    user = secret["username"]
    password = secret["password"]

    return psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=5,
        sslmode="require",
    )