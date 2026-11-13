
import { Search, Bell, UserCircle } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>Monitor and manage your inventory operations</p>
      </div>

      <div className="header-actions">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Search inventory..." />
        </div>

        <button className="header-icon">
          <Bell size={20} />
        </button>

        <div className="user-profile">
          <UserCircle size={30} />
          <div>
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
