import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Shield, Wrench, AlertTriangle, Cpu, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, availableUsers, switchUser } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-section">
          <span className="brand-logo-badge">LP</span>
          <div>
            <span className="brand-title">LabPulse</span>
            <span className="brand-subtitle">EQUIPMENT RELIABILITY & MAINTENANCE LEDGER</span>
          </div>
        </Link>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Cpu size={15} />
            <span>Equipment Register</span>
          </NavLink>

          <NavLink
            to="/faults"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <AlertTriangle size={15} />
            <span>Fault Reports</span>
          </NavLink>

          <NavLink
            to="/repairs"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Wrench size={15} />
            <span>Work Orders</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Activity size={15} />
            <span>Reliability Dashboard</span>
          </NavLink>
        </nav>

        <div className="role-switcher-container" title="Switch active actor for permission testing">
          <UserCheck size={14} style={{ color: 'var(--olive-200)' }} />
          <select
            className="role-switcher-select"
            value={currentUser?.id || 1}
            onChange={(e) => switchUser(e.target.value)}
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
