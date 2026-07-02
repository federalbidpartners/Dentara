import { Bell, LockKeyhole, Menu, Search, ShieldCheck } from "lucide-react";
import { Role } from "../lib/types";

interface TopbarProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  query: string;
  onQueryChange: (query: string) => void;
  revealPhi: boolean;
  onRevealPhiChange: (value: boolean) => void;
}

const roles: Role[] = ["Front Desk", "Billing Lead", "Owner", "Compliance Officer"];

export function Topbar({ role, onRoleChange, query, onQueryChange, revealPhi, onRevealPhiChange }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button" aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <div>
          <h1>Today Command Center</h1>
          <p>Thursday, July 2, 2026</p>
        </div>
      </div>
      <label className="search-control">
        <Search size={17} aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search patients, appointments, claims, tasks..." />
      </label>
      <select className="select-control" value={role} onChange={(event) => onRoleChange(event.target.value as Role)} aria-label="Select role">
        {roles.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className={`safe-pill ${revealPhi ? "warning" : ""}`} onClick={() => onRevealPhiChange(!revealPhi)}>
        <ShieldCheck size={16} />
        {revealPhi ? "PHI VISIBLE" : "PHI-SAFE DEMO"}
      </button>
      <button className="audit-lock">
        <LockKeyhole size={16} />
        <span>Audit Lock</span>
        <strong>Locked</strong>
      </button>
      <button className="icon-button" aria-label="Notifications">
        <Bell size={19} />
      </button>
      <div className="user-chip">SL</div>
    </header>
  );
}
