import { useState } from "react";
import { useAssignments, useAssignAsset, useReturnAsset } from "@/hooks/use-assignments";
import { useAssets } from "@/hooks/use-assets";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, CheckCircle2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const assignSchema = z.object({
  assetId: z.string().min(1, "Select an asset"),
  userId: z.string().min(1, "Select a user"),
});

export default function Assignments() {
  const { data: assignments, isLoading } = useAssignments();
  const { data: assets } = useAssets();
  const { data: users } = useUsers();
  const assignMutation = useAssignAsset();
  const returnMutation = useReturnAsset();

  // Only show non-returned assignments (ACTIVE or RETURN_REQUESTED)
  const visibleAssignments =
    assignments?.filter(
      (a) => a.status === "ACTIVE" || a.status === "RETURN_REQUESTED"
    ) || [];
  const availableAssets = assets?.filter(a => a.status === "AVAILABLE") || [];

  const form = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assetId: "",
      userId: "",
    },
  });

  function onSubmit(values: z.infer<typeof assignSchema>) {
    assignMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
      }
    });
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign assets to users and track return dates.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Assign Asset</CardTitle>
            <CardDescription>Select an available asset and a user.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAssets.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">No available assets</div>
                          ) : (
                            availableAssets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.assetId} - {asset.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowLeftRight className="h-4 w-4 mr-2" />}
                  Assign Asset
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : visibleAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No assignments yet</TableCell>
                  </TableRow>
                ) : (
                  visibleAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{assignment.asset?.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{assignment.asset?.assetId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {assignment.user?.name.charAt(0)}
                          </div>
                          <span>{assignment.user?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            assignment.status === "RETURN_REQUESTED"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }
                        >
                          {assignment.status === "RETURN_REQUESTED"
                            ? "Return requested"
                            : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {format(new Date(assignment.assignedDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 border-blue-200"
                          disabled={returnMutation.isPending}
                          onClick={() => returnMutation.mutate({ assetId: assignment.assetId })}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-2" />
                          {assignment.status === "RETURN_REQUESTED" ? "Approve return" : "Return"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
