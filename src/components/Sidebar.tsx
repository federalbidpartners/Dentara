import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  Landmark,
  LockKeyhole,
  MapPin,
  ReceiptText,
  Settings,
  ShieldCheck,
  UsersRound,
  WalletCards
} from "lucide-react";

const sections = [
  {
    label: "Operations",
    items: [
      { name: "Today", icon: CalendarDays, active: true },
      { name: "Insurance", icon: ShieldCheck },
      { name: "Claims", icon: FileText },
      { name: "Estimates", icon: WalletCards },
      { name: "Tasks", icon: ClipboardCheck }
    ]
  },
  {
    label: "Financial",
    items: [
      { name: "Revenue", icon: BarChart3 },
      { name: "Aging & AR", icon: Activity },
      { name: "Payments", icon: CreditCard }
    ]
  },
  {
    label: "Risk & Compliance",
    items: [
      { name: "Compliance", icon: LockKeyhole },
      { name: "Audit Log", icon: ReceiptText },
      { name: "Reports", icon: Landmark }
    ]
  },
  {
    label: "Admin",
    items: [
      { name: "Settings", icon: Settings },
      { name: "People & Roles", icon: UsersRound },
      { name: "Locations", icon: MapPin }
    ]
  }
];

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Dentara navigation">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" role="img">
            <path className="brand-tooth" d="M12.4 9.4c2.4-2.1 5.2-2.3 7.6-.5 2.4-1.8 5.2-1.6 7.6.5 3.4 3 3 8.6.7 13.2-1.2 2.4-2.2 5.7-2.9 8.2-.5 1.8-2.9 2.1-3.8.5L20 28.4l-1.6 2.9c-.9 1.6-3.3 1.3-3.8-.5-.7-2.5-1.7-5.8-2.9-8.2-2.3-4.6-2.7-10.2.7-13.2Z" />
            <path className="brand-spark" d="M25.5 10.3l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1 1.1-2.7Z" />
            <path className="brand-cut" d="M16.4 17.6h7.2" />
          </svg>
        </div>
        <div>
          <div className="brand-name">DENTARA</div>
          <div className="brand-subtitle">Dental Intelligence OS</div>
        </div>
      </div>
      <nav className="nav-sections">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button className={`nav-item ${item.active ? "active" : ""}`} key={item.name}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="practice-card">
        <div className="practice-avatar">BD</div>
        <div>
          <div className="practice-name">Bright Smiles Dental</div>
          <div className="practice-location">Northfield, IL</div>
        </div>
      </div>
    </aside>
  );
}
