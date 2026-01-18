// components/staff/issue/IssueTabs.jsx
import { useState } from "react";
import SingleIssueForm from "./SingleIssueForm";
import BulkIssueForm from "./BulkIssueForm";
import EmailDispatchPanel from "./EmailDispatchPanel";

export default function IssueTabs() {
  const [tab, setTab] = useState("single");

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Tab active={tab === "single"} onClick={() => setTab("single")}>
          Single Issue
        </Tab>

        <Tab active={tab === "bulk"} onClick={() => setTab("bulk")}>
          Bulk Upload
        </Tab>

        <Tab active={tab === "email"} onClick={() => setTab("email")}>
          Email Notifications
        </Tab>
      </div>

      {/* Content */}
      {tab === "single" && <SingleIssueForm />}
      {tab === "bulk" && <BulkIssueForm />}
      {tab === "email" && <EmailDispatchPanel />}
    </>
  );
}

function Tab({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded transition ${
        active
          ? "bg-slate-700 text-white"
          : "bg-slate-900 text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
