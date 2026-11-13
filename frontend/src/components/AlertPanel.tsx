
interface AlertItem {
  id: number;
  alert_type: string;
  message: string;
  severity: string;
  status: string;
}

interface Props {
  alerts: AlertItem[];
}

export default function AlertPanel({ alerts }: Props) {
  const activeAlerts = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  );

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Active Alerts</h3>
          <p>Inventory issues requiring attention</p>
        </div>
        <span className="alert-count">{activeAlerts.length} Active</span>
      </div>

      <div className="alert-list">
        {activeAlerts.map((alert) => (
          <div className="alert-item" key={alert.id}>
            <div className={`alert-indicator ${alert.severity.toLowerCase()}`} />

            <div className="alert-content">
              <strong>
                {alert.alert_type.replace("_", " ")}
              </strong>
              <p>{alert.message}</p>
            </div>

            <span className="alert-severity">
              {alert.severity}
            </span>
          </div>
        ))}

        {activeAlerts.length === 0 && (
          <p className="empty-state">No active alerts.</p>
        )}
      </div>
    </div>
  );
}
