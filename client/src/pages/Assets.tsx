import { useState } from "react";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/use-assets";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssetSchema, Asset } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Schema for form (handling dates as strings for input type="date")
const formSchema = insertAssetSchema.extend({
  purchaseDate: z.string(), // Input type="date" returns string
});

export default function Assets() {
  const { data: assets, isLoading } = useAssets();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = user?.role === "ADMIN";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const filteredAssets = assets?.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case "AVAILABLE": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case "ASSIGNED": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "UNDER_MAINTENANCE": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "RETIRED": return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage inventory and track equipment status.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingAsset(null); setIsDialogOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, tag, or serial..." 
            className="pl-9 bg-muted/30 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Asset Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Purchase Date</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading assets...</TableCell>
              </TableRow>
            ) : filteredAssets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No assets found</TableCell>
              </TableRow>
            ) : (
              filteredAssets?.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium font-mono text-xs">{asset.assetId}</TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{asset.serialNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-medium border ${getStatusColor(asset.status)}`}>
                      {asset.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {format(new Date(asset.purchaseDate), 'MMM d, yyyy')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => { setEditingAsset(asset); setIsDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteAssetButton id={asset.id} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssetDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialData={editingAsset} 
      />
    </div>
  );
}

function DeleteAssetButton({ id }: { id: string }) {
  const { mutate, isPending } = useDeleteAsset();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
      disabled={isPending}
      onClick={() => {
        if (confirm("Are you sure you want to delete this asset?")) {
          mutate(id);
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function AssetDialog({ open, onOpenChange, initialData }: { open: boolean; onOpenChange: (open: boolean) => void; initialData: Asset | null }) {
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: "",
      name: "",
      category: "",
      serialNumber: "",
      status: "AVAILABLE",
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  // Reset form when dialog opens/closes or initialData changes
  if (open && initialData && form.getValues().assetId !== initialData.assetId) {
    form.reset({
      ...initialData,
      purchaseDate: initialData.purchaseDate.toString(), // Ensure string format
    });
  } else if (open && !initialData && form.getValues().assetId !== "") {
    form.reset({
      assetId: "",
      name: "",
      category: "",
      serialNumber: "",
      status: "AVAILABLE",
      purchaseDate: new Date().toISOString().split('T')[0],
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (initialData) {
      updateMutation.mutate({ id: initialData.id, ...values }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => onOpenChange(false)
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <DialogDescription>
            Enter the details for the equipment below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="AST-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Laptop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="MacBook Pro 16" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="SN12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="UNDER_MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : initialData ? "Save Changes" : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
