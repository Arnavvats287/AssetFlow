import { useState } from "react";
import { useUsers, useCreateUser, useDeactivateUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Ban, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

export default function Users() {
  const { data: users, isLoading } = useUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const deactivateMutation = useDeactivateUser();

  const sortedUsers = users?.sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === "ACTIVE" ? -1 : 1;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system users and their roles.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell>
              </TableRow>
            ) : sortedUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
              </TableRow>
            ) : (
              sortedUsers?.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.status === "ACTIVE" && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Deactivate user ${user.name}?`)) {
                            deactivateMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Ban className="h-4 w-4 mr-2" /> Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

function UserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateUser();
  
  const form = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "Password123!", // Default temp password
      role: "USER",
      status: "ACTIVE",
    },
  });

  function onSubmit(values: z.infer<typeof insertUserSchema>) {
    createMutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
