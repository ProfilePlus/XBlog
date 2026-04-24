import { AdminFeedbackProvider } from "@/components/admin/admin-feedback";
import "./admin-globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app">
      <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
    </div>
  );
}
