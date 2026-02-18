import { useMyAssets, useRequestReturn } from "@/hooks/use-my-assets";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RotateCcw, Loader2 } from "lucide-react";

export default function MyAssets() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useMyAssets();
  const requestReturnMutation = useRequestReturn();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
        <p className="text-muted-foreground mt-1">
          View the equipment currently assigned to you and request returns.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Assigned Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading your assets...
                  </TableCell>
                </TableRow>
              ) : !assignments || assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    You currently have no assigned assets.
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.asset.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {assignment.asset.assetId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.asset.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-medium border bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {assignment.status === "RETURN_REQUESTED"
                          ? "Return Requested"
                          : assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {assignment.assignedDate
                        ? format(new Date(assignment.assignedDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {assignment.status === "ACTIVE" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                          disabled={requestReturnMutation.isPending}
                          onClick={() => requestReturnMutation.mutate({ assetId: assignment.assetId })}
                        >
                          {requestReturnMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5 mr-2" />
                          )}
                          Request Return
                        </Button>
                      ) : assignment.status === "RETURN_REQUESTED" ? (
                        <span className="text-xs text-muted-foreground">Pending approval</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Returned</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

