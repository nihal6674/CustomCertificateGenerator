import CertificatesTable from "../../components/staff/certificates/CertificatesTable";

export default function StaffCertificatesPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Issued Certificates</h1>
        
      </header>

      {/* Content */}
      <main className="p-8">
        <CertificatesTable />
      </main>
    </div>
  );
}
