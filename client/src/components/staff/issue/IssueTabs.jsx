// components/staff/issue/IssueTabs.jsx
import { useState } from "react";
import SingleIssueForm from "./SingleIssueForm";
import BulkIssueForm from "./BulkIssueForm";

export default function IssueTabs() {
  const [tab, setTab] = useState("single");

  return (
    <>
      <div className="flex gap-4 mb-6">
        <Tab active={tab === "single"} onClick={() => setTab("single")}>
          Single Issue
        </Tab>
        <Tab active={tab === "bulk"} onClick={() => setTab("bulk")}>
          Bulk Upload
        </Tab>
      </div>

      {tab === "single" ? <SingleIssueForm /> : <BulkIssueForm />}
    </>
  );
}

function Tab({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded ${
        active ? "bg-slate-700" : "bg-slate-900 text-slate-400"
      }`}
    >
      {children}
    </button>
  );
}
