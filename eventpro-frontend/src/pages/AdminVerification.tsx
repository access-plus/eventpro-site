import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import type { PendingVerification } from "@/types/api";

const AdminVerification = () => {
  const adminApi = useAdminApi();
  const { toast } = useToast();
  const [list, setList] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const fetchPending = () => {
    if (!adminApi) return;
    setLoading(true);
    adminApi
      .getVerificationPending(50)
      .then(setList)
      .catch(() => {
        toast({ title: "Failed to load pending verifications", variant: "destructive" });
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, [adminApi]);

  const handleApprove = async (submissionId: string) => {
    if (!adminApi) return;
    setActingId(submissionId);
    try {
      await adminApi.approveVerification(submissionId);
      setList((prev) => prev.filter((s) => s.id !== submissionId));
      toast({ title: "Verification approved" });
    } catch {
      toast({ title: "Failed to approve", variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    if (!adminApi) return;
    setActingId(submissionId);
    try {
      await adminApi.rejectVerification(submissionId, rejectReason[submissionId] || undefined);
      setList((prev) => prev.filter((s) => s.id !== submissionId));
      setRejectReason((prev) => ({ ...prev, [submissionId]: "" }));
      toast({ title: "Verification rejected" });
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  if (!adminApi) return null;

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Verification (KYC)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending submissions</CardTitle>
          <CardDescription>
            Review and approve or reject identity verification requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8">No pending verifications.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => {
                  const busy = actingId === s.id;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.legalEntityType || "—"}</TableCell>
                      <TableCell>{[s.addressCity, s.addressState].filter(Boolean).join(", ") || "—"}</TableCell>
                      <TableCell>{formatDate(s.submittedAt)}</TableCell>
                      <TableCell className="text-right space-y-2">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Input
                            placeholder="Rejection reason (optional)"
                            className="max-w-[200px] h-8 text-sm"
                            value={rejectReason[s.id] ?? ""}
                            onChange={(e) =>
                              setRejectReason((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(s.id)}
                            disabled={busy}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(s.id)}
                            disabled={busy}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminVerification;
