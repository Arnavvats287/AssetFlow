import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, FileText } from "lucide-react";
import { api } from "@shared/routes";
import { getAuthHeader } from "@/lib/auth-helper";

export default function Reports() {
  
  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Failed to download report");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Export system data to CSV format.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle>Asset Inventory Report</CardTitle>
            <CardDescription>
              Complete list of all registered assets including status, category, and serial numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2" 
              onClick={() => handleDownload(api.admin.reports.assets.path, 'assets_report.csv')}
            >
              <FileDown className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-2">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle>Assignment History Report</CardTitle>
            <CardDescription>
              Historical record of all asset assignments and returns by user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => handleDownload(api.admin.reports.assignments.path, 'assignments_report.csv')}
            >
              <FileDown className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
