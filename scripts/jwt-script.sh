#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

PRIVATE_KEY_FILE="${1:-${ROOT_DIR}/jwt-private.pem}"
PUBLIC_KEY_FILE="${2:-${ROOT_DIR}/jwt-public.pem}"
ENV_FILE="${3:-${ROOT_DIR}/.env}"
JWT_ISSUER_VALUE="${JWT_ISSUER_VALUE:-eventpro}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl is required but not installed." >&2
  exit 1
fi

if [ ! -f "${PRIVATE_KEY_FILE}" ]; then
  echo "Error: private key not found at ${PRIVATE_KEY_FILE}" >&2
  exit 1
fi

touch "${ENV_FILE}"

upsert_env_var() {
  local key="$1"
  local value="$2"
  local env_file="$3"
  local tmp_file

  tmp_file="$(mktemp)"
  awk -v key="${key}" -v value="${value}" '
    BEGIN { found = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      found = 1
      next
    }
    { print }
    END {
      if (!found) {
        print key "=" value
      }
    }
  ' "${env_file}" > "${tmp_file}"
  mv "${tmp_file}" "${env_file}"
}

echo "Generating public key from private key..."
openssl rsa -in "${PRIVATE_KEY_FILE}" -pubout -out "${PUBLIC_KEY_FILE}" >/dev/null 2>&1

echo "Encoding JWT keys for .env..."
JWT_PRIVATE_KEY="$(openssl pkcs8 -topk8 -inform PEM -outform DER -in "${PRIVATE_KEY_FILE}" -nocrypt | base64 | tr -d '\n')"
JWT_PUBLIC_KEY="$(openssl rsa -in "${PRIVATE_KEY_FILE}" -pubout -outform DER 2>/dev/null | base64 | tr -d '\n')"

upsert_env_var "JWT_PRIVATE_KEY" "${JWT_PRIVATE_KEY}" "${ENV_FILE}"
upsert_env_var "JWT_PUBLIC_KEY" "${JWT_PUBLIC_KEY}" "${ENV_FILE}"
upsert_env_var "JWT_ISSUER" "${JWT_ISSUER_VALUE}" "${ENV_FILE}"

echo "Done."
echo "Private key: ${PRIVATE_KEY_FILE}"
echo "Public key:  ${PUBLIC_KEY_FILE}"
echo "Updated env: ${ENV_FILE}"
