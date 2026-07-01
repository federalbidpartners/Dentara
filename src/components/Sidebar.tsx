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
        <div className="brand-mark">D</div>
        <div>
          <div className="brand-name">DENTARA</div>
          <div className="brand-subtitle">AI Dental Operating System</div>
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
