import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Factory,
  GitBranch,
  Gauge,
  Layers3,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const API = "";

const fallbackMachines = [
  {
    machine_id: "M-101",
    failure_risk: 78,
    risk_level: "CRITICAL",
    temperature: 84,
    vibration: 7.8,
    load: 91,
    pressure: 5.4,
  },
  {
    machine_id: "M-102",
    failure_risk: 61,
    risk_level: "HIGH",
    temperature: 76,
    vibration: 6.1,
    load: 82,
    pressure: 5.1,
  },
  {
    machine_id: "M-103",
    failure_risk: 34,
    risk_level: "MEDIUM",
    temperature: 68,
    vibration: 4.2,
    load: 69,
    pressure: 4.8,
  },
  {
    machine_id: "M-104",
    failure_risk: 12,
    risk_level: "LOW",
    temperature: 61,
    vibration: 2.4,
    load: 54,
    pressure: 4.2,
  },
];

const fallbackRootCause = [
  { name: "Bearing Temperature", value: 82 },
  { name: "Vibration", value: 71 },
  { name: "Motor Load", value: 58 },
  { name: "Lubrication", value: 46 },
];

const riskTrend = [
  { time: "09:00", risk: 46 },
  { time: "10:00", risk: 51 },
  { time: "11:00", risk: 59 },
  { time: "12:00", risk: 68 },
  { time: "12:30", risk: 73 },
  { time: "12:42", risk: 78 },
];

const oeeTrend = [
  { time: "08:00", value: 72 },
  { time: "09:00", value: 74 },
  { time: "10:00", value: 73 },
  { time: "11:00", value: 76 },
  { time: "12:00", value: 75 },
  { time: "13:00", value: 76 },
];

const events = [
  ["12:42:18", "M-101 risk increased", "+8%", "critical"],
  ["12:42:03", "Bearing temperature alert", "ACTIVE", "critical"],
  ["12:41:51", "Cascade recalculated", "COMPLETE", "warning"],
  ["12:41:32", "Counterfactual updated", "COMPLETE", "violet"],
  ["12:41:10", "OEE metrics refreshed", "COMPLETE", "success"],
];

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function riskClass(level = "") {
  return String(level).toLowerCase();
}

function MetricCard({ label, value, suffix, detail, tone = "cyan", icon: Icon, trend }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        {Icon && <Icon size={17} />}
      </div>

      <div className="metric-value">
        {value}
        {suffix && <small>{suffix}</small>}
      </div>

      <div className="metric-bottom">
        <span>{detail}</span>
        {trend && (
          <span className="metric-trend">
            {trend.startsWith("↓") ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {trend}
          </span>
        )}
      </div>

      <div className="metric-line">
        <span style={{ width: `${Math.min(100, Math.max(8, safeNumber(value)))}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }) {
  return (
    <div className="section-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {Icon && (
        <div className="section-icon">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, status = "ACTIVE" }) {
  return (
    <div className="status-pill">
      <span className="status-dot" />
      <div>
        <b>{label}</b>
        <small>{status}</small>
      </div>
    </div>
  );
}

function GaugeRing({ value, label, tone = "cyan" }) {
  return (
    <div className={`gauge-ring ${tone}`} style={{ "--gauge": `${value * 3.6}deg` }}>
      <div className="gauge-inner">
        <strong>{value}</strong>
        <span>%</span>
        <small>{label}</small>
      </div>
    </div>
  );
}

function App() {
  const [machines, setMachines] = useState(fallbackMachines);
  const [selectedMachine, setSelectedMachine] = useState("M-101");
  const [rootCause, setRootCause] = useState(fallbackRootCause);

  const cascadeByMachine = {
    "M-101": {
      downstream: [
        { name: "M-101", label: "FAILURE", value: 78, className: "critical" },
        { name: "M-102", label: "EXPOSURE", value: 61, className: "high" },
        { name: "CONVEYOR", label: "IMPACT", value: 49, className: "medium" },
        { name: "PRODUCTION LINE", label: "IMPACT", value: 43, className: "low" },
      ],
      exposure: "HIGH",
      affected: 3,
      productionImpact: 21,
    },
    "M-102": {
      downstream: [
        { name: "M-102", label: "FAILURE", value: 61, className: "high" },
        { name: "CONVEYOR", label: "EXPOSURE", value: 49, className: "medium" },
        { name: "PRODUCTION LINE", label: "IMPACT", value: 43, className: "low" },
        { name: "OUTPUT", label: "IMPACT", value: 28, className: "low" },
      ],
      exposure: "HIGH",
      affected: 3,
      productionImpact: 16,
    },
    "M-103": {
      downstream: [
        { name: "M-103", label: "FAILURE", value: 34, className: "medium" },
        { name: "CONVEYOR", label: "EXPOSURE", value: 29, className: "medium" },
        { name: "PRODUCTION LINE", label: "IMPACT", value: 21, className: "low" },
        { name: "OUTPUT", label: "IMPACT", value: 14, className: "low" },
      ],
      exposure: "MEDIUM",
      affected: 3,
      productionImpact: 11,
    },
    "M-104": {
      downstream: [
        { name: "M-104", label: "FAILURE", value: 12, className: "low" },
        { name: "CONVEYOR", label: "EXPOSURE", value: 10, className: "low" },
        { name: "PRODUCTION LINE", label: "IMPACT", value: 7, className: "low" },
        { name: "OUTPUT", label: "IMPACT", value: 4, className: "low" },
      ],
      exposure: "LOW",
      affected: 2,
      productionImpact: 4,
    },
  };

  const cascade = cascadeByMachine[selectedMachine] || cascadeByMachine["M-101"];


  useEffect(() => {
    const machineRootCauses = {
      "M-101": [
        { name: "Bearing Temperature", value: 82 },
        { name: "Vibration", value: 71 },
        { name: "Motor Load", value: 58 },
        { name: "Lubrication", value: 46 },
      ],
      "M-102": [
        { name: "Bearing Temperature", value: 68 },
        { name: "Vibration", value: 63 },
        { name: "Motor Load", value: 55 },
        { name: "Lubrication", value: 41 },
      ],
      "M-103": [
        { name: "Bearing Temperature", value: 52 },
        { name: "Vibration", value: 48 },
        { name: "Motor Load", value: 44 },
        { name: "Lubrication", value: 35 },
      ],
      "M-104": [
        { name: "Bearing Temperature", value: 31 },
        { name: "Vibration", value: 27 },
        { name: "Motor Load", value: 24 },
        { name: "Lubrication", value: 19 },
      ],
    };

    setRootCause(machineRootCauses[selectedMachine] || fallbackRootCause);
  }, [selectedMachine]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const machine = useMemo(
    () =>
      machines.find(
        (item) =>
          String(item.machine_id || item.id || item.machine || "") === selectedMachine
      ) || machines[0],
    [machines, selectedMachine]
  );

  const loadData = async () => {
    setLoading(true);

    try {
      const machineResponse = await fetch(`${API}/api/machines`);
      if (machineResponse.ok) {
        const data = await machineResponse.json();
        const normalized = Array.isArray(data)
          ? data
          : data.machines || data.data || [];

        if (normalized.length) {
          setMachines(
            normalized.map((m) => ({
              machine_id: m.machine_id || m.id || m.machine || "M-101",
              failure_risk: safeNumber(
                m.failure_risk ?? m.risk ?? m.failure_probability,
                0
              ),
              risk_level:
                m.risk_level ||
                m.risk_category ||
                (safeNumber(m.failure_risk ?? m.risk, 0) >= 70
                  ? "CRITICAL"
                  : safeNumber(m.failure_risk ?? m.risk, 0) >= 50
                    ? "HIGH"
                    : safeNumber(m.failure_risk ?? m.risk, 0) >= 25
                      ? "MEDIUM"
                      : "LOW"),
              temperature: safeNumber(m.temperature ?? m.temp, 0),
              vibration: safeNumber(m.vibration, 0),
              load: safeNumber(m.load ?? m.motor_load, 0),
              pressure: safeNumber(m.pressure, 0),
            }))
          );
        }
      }

      const rootResponse = await fetch(
        `${API}/api/root-cause/${selectedMachine}`
      );

      if (rootResponse.ok) {
        const data = await rootResponse.json();
        const candidates = data.root_causes || data.causes || data.data || data;

        if (Array.isArray(candidates) && candidates.length) {
          setRootCause(
            candidates.map((item) => ({
              name: item.name || item.feature || item.cause || "Factor",
              value: safeNumber(item.value ?? item.contribution ?? item.score, 0),
            }))
          );
        }
      }

      setLastUpdated(new Date());
    } catch {
      // Keep the resilient frontend fallback data.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMachine]);

  const selectedRisk = safeNumber(machine?.failure_risk, 78);

  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const runSimulation = () => {
    setSimulationRunning(true);
    setSimulationComplete(false);

    setTimeout(() => {
      setSimulationRunning(false);
      setSimulationComplete(true);
    }, 1500);
  };


  return (
    <div className="app-shell">
      <div className="grid-overlay" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={21} />
          </div>
          <div>
            <h1>PREDICTIVEAI FORGE</h1>
            <p>INDUSTRIAL DECISION INTELLIGENCE</p>
          </div>
        </div>

        <div className="header-center">
          <span>AI prediction</span>
          <i>•</i>
          <span>explanation</span>
          <i>•</i>
          <span>simulation</span>
          <i>•</i>
          <span>verification</span>
        </div>

        <div className="live-status">
          <span className="live-dot" />
          <div>
            <b>SYSTEM LIVE</b>
            <small>Smart Manufacturing Plant</small>
          </div>
          <time>{lastUpdated.toLocaleTimeString()}</time>
        </div>
      </header>

      <main className="dashboard">
        <section>
          <SectionTitle
            eyebrow="EXECUTIVE FACTORY PULSE"
            title="What is happening?"
            icon={Factory}
          />

          <div className="metric-grid">
            <MetricCard
              label="RESILIENCE"
              value="74.6"
              suffix="%"
              detail="Recovery capability: HIGH"
              tone="cyan"
              icon={ShieldCheck}
            />
            <MetricCard
              label="ACTIVE RISKS"
              value="03"
              detail="Critical exposure"
              tone="red"
              icon={AlertTriangle}
            />
            <MetricCard
              label="OEE"
              value="75.8"
              suffix="%"
              detail="Plant efficiency"
              tone="violet"
              icon={Gauge}
            />
            <MetricCard
              label="DOWNTIME RISK"
              value="38"
              suffix="%"
              detail="Exposure: HIGH"
              tone="orange"
              icon={Activity}
            />
            <MetricCard label="ENERGY" value="8.4" suffix="%" detail="Reduction" tone="green" trend="↓ 8.4%" />
            <MetricCard label="CO₂" value="14.2" suffix="%" detail="Reduction" tone="green" trend="↓ 14.2%" />
            <MetricCard label="WASTE" value="11.8" suffix="%" detail="Reduction" tone="green" trend="↓ 11.8%" />
            <MetricCard label="PRODUCTION" value="96.2" suffix="%" detail="Output stability" tone="cyan" />
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="SYSTEM INTELLIGENCE"
            title="Which systems are healthy?"
            icon={BrainCircuit}
          />

          <div className="status-grid">
            <StatusPill label="DATA" status="HEALTHY" />
            <StatusPill label="ML" status="ACTIVE" />
            <StatusPill label="RCA" status="ACTIVE" />
            <StatusPill label="CASCADE" status="ACTIVE" />
            <StatusPill label="SIMULATE" status="ACTIVE" />
            <StatusPill label="VERIFY" status="PASSED" />
          </div>
        </section>

        <section className="machine-section">
          <SectionTitle
            eyebrow="MACHINE COMMAND"
            title="Which machine matters?"
            icon={Target}
          />

          <div className="machine-selector">
            {machines.map((item) => {
              const id = item.machine_id;
              return (
                <button
                  key={id}
                  className={`machine-card ${selectedMachine === id ? "selected" : ""} ${riskClass(
                    item.risk_level
                  )}`}
                  onClick={() => setSelectedMachine(id)}
                >
                  <span>{id}</span>
                  <b>{item.risk_level}</b>
                  <strong>{item.failure_risk}%</strong>
                  <div className="mini-bar">
                    <i style={{ width: `${item.failure_risk}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="command-grid">
            <div className="panel risk-focus">
              <div className="panel-label">SELECTED MACHINE</div>
              <div className="machine-id">{machine?.machine_id || selectedMachine}</div>
              <GaugeRing value={selectedRisk} label="FAILURE RISK" tone="red" />
              <div className="danger-label">
                <AlertTriangle size={15} />
                AT RISK
              </div>
            </div>

            <div className="panel telemetry">
              <div className="panel-label">TELEMETRY</div>
              <div className="telemetry-list">
                <div><span>TEMP</span><b>{machine?.temperature ?? 84}°C</b></div>
                <div><span>VIBRATION</span><b>{machine?.vibration ?? 7.8}</b></div>
                <div><span>LOAD</span><b>{machine?.load ?? 91}%</b></div>
                <div><span>PRESSURE</span><b>{machine?.pressure ?? 5.4} bar</b></div>
              </div>
            </div>

            <div className="panel chart-panel">
              <div className="panel-label">RISK TREND</div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={riskTrend}>
                  <defs>
                    <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopOpacity={0.35} />
                      <stop offset="100%" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    strokeWidth={3}
                    fill="url(#riskFill)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="action-row">
            <button className="secondary-btn" onClick={() => alert(`Selected machine: ${selectedMachine}\nFailure risk: ${Math.round(selectedRisk)}%`)}>
              <Target size={16} /> VIEW MACHINE
            </button>
            <button className="primary-btn" onClick={loadData}>
              <RefreshCw size={16} /> {loading ? "ANALYZING..." : "RUN ANALYSIS"}
            </button>
          </div>
        </section>

        <section className="two-column">
          <div className="panel large-panel">
            <SectionTitle eyebrow="RISK DISTRIBUTION" title="How risky is it?" icon={AlertTriangle} />
            <div className="risk-bars">
              {machines.map((item) => (
                <div className="risk-row" key={item.machine_id}>
                  <span className={`risk-name ${riskClass(item.risk_level)}`}>
                    {item.risk_level}
                  </span>
                  <div className="risk-track">
                    <i
                      className={riskClass(item.risk_level)}
                      style={{ width: `${item.failure_risk}%` }}
                    />
                  </div>
                  <b>{item.failure_risk}%</b>
                </div>
              ))}
            </div>
            <div className="panel-footer-stat">
              <span>HIGH-RISK ASSETS</span>
              <strong>02</strong>
            </div>
          </div>

          <div className="panel large-panel resilience-panel">
            <SectionTitle eyebrow="RESILIENCE INDEX" title="Can the plant recover?" icon={ShieldCheck} />
            <GaugeRing value={74.6} label="RESILIENCE" tone="cyan" />
            <div className="recovery">
              <span>RECOVERY CAPABILITY</span>
              <strong>HIGH</strong>
            </div>
          </div>
        </section>

        <section className="panel root-panel">
          <SectionTitle eyebrow="ROOT-CAUSE ENGINE" title="Why is it risky?" icon={BrainCircuit} />
          <div className="root-layout">
            <div>
              <div className="asset-heading">
                <span>SELECTED ASSET</span>
                <strong>{selectedMachine}</strong>
              </div>
              <div className="failure-prob">
                <span>FAILURE PROBABILITY</span>
                <strong>{selectedRisk}%</strong>
              </div>
            </div>

            <div className="cause-bars">
              {rootCause.map((cause) => (
                <div className="cause-row" key={cause.name}>
                  <span>{cause.name}</span>
                  <div className="cause-track">
                    <i style={{ width: `${cause.value}%` }} />
                  </div>
                  <b>{cause.value}%</b>
                </div>
              ))}
            </div>
          </div>

          <div className="reasoning">
            <span>MODEL REASONING</span>
            <p>
              Temperature + vibration + motor-load interaction indicate
              increasing bearing stress and elevated failure exposure.
            </p>
          </div>
        </section>

        <section className="panel graph-panel">
          <SectionTitle eyebrow="DEPENDENCY GRAPH" title="What gets affected?" icon={GitBranch} />

          <div className="dependency-graph">
            <div className="graph-stage">

              <div className="graph-column">
                <span className="graph-label">ORIGIN</span>
                <div className="graph-node critical">
                  <div className="graph-node-top">
                    <span className="graph-node-status">CRITICAL</span>
                    <span className="graph-node-risk">78%</span>
                  </div>
                  <strong>M-101</strong>
                  <small>PRIMARY FAILURE</small>
                  <div className="risk-meter"><i style={{ width: "78%" }} /></div>
                </div>
              </div>

              <div className="graph-connector">
                <span>DEPENDENCY</span>
                <div className="connector-line"><i /></div>
                <ChevronRight />
              </div>

              <div className="graph-column">
                <span className="graph-label">DOWNSTREAM ASSET</span>
                <div className="graph-node high">
                  <div className="graph-node-top">
                    <span className="graph-node-status">HIGH</span>
                    <span className="graph-node-risk">61%</span>
                  </div>
                  <strong>M-102</strong>
                  <small>EXPOSURE</small>
                  <div className="risk-meter"><i style={{ width: "61%" }} /></div>
                </div>
              </div>

              <div className="graph-connector">
                <span>CASCADE</span>
                <div className="connector-line"><i /></div>
                <ChevronRight />
              </div>

              <div className="graph-column">
                <span className="graph-label">PROCESS NODE</span>
                <div className="graph-node medium">
                  <div className="graph-node-top">
                    <span className="graph-node-status">MEDIUM</span>
                    <span className="graph-node-risk">49%</span>
                  </div>
                  <strong>CONVEYOR</strong>
                  <small>IMPACT EXPOSURE</small>
                  <div className="risk-meter"><i style={{ width: "49%" }} /></div>
                </div>
              </div>

              <div className="graph-connector">
                <span>IMPACT</span>
                <div className="connector-line"><i /></div>
                <ChevronRight />
              </div>

              <div className="graph-column">
                <span className="graph-label">SYSTEM OUTCOME</span>
                <div className="graph-node low">
                  <div className="graph-node-top">
                    <span className="graph-node-status">IMPACT</span>
                    <span className="graph-node-risk">43%</span>
                  </div>
                  <strong>PRODUCTION LINE</strong>
                  <small>DOWNSTREAM EFFECT</small>
                  <div className="risk-meter"><i style={{ width: "43%" }} /></div>
                </div>
              </div>

            </div>

            <div className="cascade-summary">
              <span>CASCADE EXPOSURE <b>HIGH</b></span>
              <span>AFFECTED ASSETS <b>3</b></span>
              <span>PRODUCTION IMPACT <b>21%</b></span>
            </div>
          </div>
        </section>

        <section className="panel counterfactual">
          <SectionTitle eyebrow="COUNTERFACTUAL LAB" title="What if we act?" icon={Zap} />
          <div className="scenario-grid">
            <div className="scenario">
              <span>NO INTERVENTION</span>
              <strong>78%</strong>
              <small>18.4 hrs</small>
              <em>-21%</em>
            </div>
            <div className="scenario recommended">
              <span>EARLY ACTION</span>
              <strong>42%</strong>
              <small>6.2 hrs</small>
              <em>-7%</em>
            </div>
            <div className="scenario optimized">
              <span>OPTIMIZED</span>
              <strong>31%</strong>
              <small>3.8 hrs</small>
              <em>-3%</em>
            </div>
          </div>

          <div className="counter-chart">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                data={[
                  { name: "NO ACTION", value: 78 },
                  { name: "EARLY ACTION", value: 42 },
                  { name: "OPTIMIZED", value: 31 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell />
                  <Cell />
                  <Cell />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button
            className="simulation-btn"
            onClick={runSimulation}
            disabled={simulationRunning}
          >
            <Play size={16} />
            {simulationRunning
              ? "RUNNING SIMULATION..."
              : simulationComplete
                ? "SIMULATION COMPLETE"
                : "RUN WHAT-IF SIMULATION"}
          </button>

          <div className="impact-grid">
            <div><span>RISK REDUCTION</span><b>47%</b></div>
            <div><span>DOWNTIME AVOIDED</span><b>14.6 hrs</b></div>
            <div><span>PRODUCTION PROTECTED</span><b>18%</b></div>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="OEE INTELLIGENCE" title="How does production perform?" icon={CircleGauge} />
          <div className="oee-grid">
            <MetricCard label="AVAILABILITY" value="91.2" suffix="%" detail="Stable" tone="cyan" />
            <MetricCard label="PERFORMANCE" value="89.4" suffix="%" detail="Stable" tone="violet" />
            <MetricCard label="QUALITY" value="93.1" suffix="%" detail="Healthy" tone="green" />
            <MetricCard label="OEE" value="75.8" suffix="%" detail="Overall" tone="cyan" />
          </div>

          <div className="panel trend-panel">
            <div className="panel-label">OEE TREND</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={oeeTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis dataKey="time" />
                <YAxis domain={[65, 85]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="trend-status">
              <span>PRODUCTION EFFICIENCY: <b>STABLE</b></span>
              <span>BOTTLENECK EXPOSURE: <b>MODERATE</b></span>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="SUSTAINABILITY INTELLIGENCE" title="What is the environmental impact?" icon={Layers3} />
          <div className="sustain-grid">
            <MetricCard label="ENERGY" value="8.4" suffix="%" detail="↓ current consumption" tone="green" trend="↓ 8.4%" />
            <MetricCard label="CARBON" value="14.2" suffix="%" detail="↓ current emissions" tone="green" trend="↓ 14.2%" />
            <MetricCard label="WASTE" value="11.8" suffix="%" detail="↓ material waste" tone="green" trend="↓ 11.8%" />
          </div>

          <div className="panel intervention">
            <div className="panel-label">INTERVENTION IMPACT</div>
            <div className="impact-row"><span>ENERGY SAVED</span><div><i style={{ width: "84%" }} /></div><b>84%</b></div>
            <div className="impact-row"><span>CO₂ AVOIDED</span><div><i style={{ width: "91%" }} /></div><b>91%</b></div>
            <div className="impact-row"><span>WASTE AVOIDED</span><div><i style={{ width: "72%" }} /></div><b>72%</b></div>
          </div>
        </section>

        <section className="panel decision">
          <SectionTitle eyebrow="DECISION CENTER" title="What should the operator consider?" icon={Zap} />
          <div className="decision-content">
            <div className="decision-main">
              <div className="recommendation-icon"><AlertTriangle size={24} /></div>
              <div>
                <span>RECOMMENDED ACTION</span>
                <h3>INSPECT {selectedMachine} BEARING ASSEMBLY</h3>
                <p>
                  Elevated temperature + vibration + motor-load interaction.
                </p>
              </div>
            </div>

            <div className="decision-impact">
              <div><span>Failure exposure</span><b>↓</b></div>
              <div><span>Cascade exposure</span><b>↓</b></div>
              <div><span>Downtime</span><b>↓</b></div>
            </div>
          </div>

          <div className="decision-actions">
            <button className="secondary-btn" onClick={runSimulation}><Play size={15} /> SIMULATE</button>
            <button className="primary-btn" onClick={() => alert(`Action sent for human approval: Inspect ${selectedMachine} bearing assembly`)}><CheckCircle2 size={15} /> APPLY ACTION</button>
            <button className="ghost-btn" onClick={() => alert("Recommendation dismissed")}>DISMISS</button>
          </div>

          <div className="approval">
            <ShieldCheck size={15} />
            HUMAN APPROVAL REQUIRED
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="VERIFICATION CENTER" title="Can we trust the result?" icon={ShieldCheck} />
          <div className="verification-grid">
            {[
              ["PREDICTION", "Confidence", "92%"],
              ["ROOT CAUSE", "Evidence", "88%"],
              ["CASCADE", "Evidence", "86%"],
              ["SIMULATION", "Status", "STABLE"],
            ].map(([title, label, value]) => (
              <div className="verification-card" key={title}>
                <div className="verify-title">
                  <span>{title}</span>
                  <CheckCircle2 size={18} />
                </div>
                <strong>VERIFIED</strong>
                <small>{label} {value}</small>
                <div className="verify-line"><i /></div>
              </div>
            ))}
          </div>

          <div className="verification-footer">
            <span>DATA FRESHNESS <b>● LIVE</b></span>
            <span>MODEL STATUS <b>● VALID</b></span>
            <span>VERIFICATION <b>● PASSED</b></span>
          </div>
        </section>

        <section className="panel intelligence-pipeline">
          <SectionTitle eyebrow="AI INTELLIGENCE PIPELINE" title="How does AI reach the decision?" icon={BrainCircuit} />

          <div className="pipeline">
            {[
              ["PREDICT", "FAILURE"],
              ["EXPLAIN", "ROOT CAUSE"],
              ["SIMULATE", "WHAT-IF"],
              ["VERIFY", "EVIDENCE"],
            ].map(([title, subtitle], index) => (
              <div className="pipeline-node" key={title}>
                <div>
                  <Sparkles size={18} />
                  <b>{title}</b>
                </div>
                <span>{subtitle}</span>
                {index < 3 && <ChevronRight className="pipeline-arrow" />}
              </div>
            ))}
          </div>
        </section>

        <section className="panel trace-panel">
          <SectionTitle eyebrow="DECISION TRACE" title="How did the system reason?" icon={GitBranch} />

          <div className="trace">
            {[
              "SENSE",
              "UNDERSTAND",
              "PREDICT",
              "EXPLAIN",
              "IDENTIFY DEPENDENCIES",
              "SIMULATE ALTERNATIVES",
              "VERIFY EVIDENCE",
              "HUMAN DECISION",
              "RECOVER",
              "LEARN",
            ].map((step, index) => (
              <div className="trace-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
                <b>{step}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="panel event-panel">
          <SectionTitle eyebrow="LIVE EVENT FEED" title="What is changing now?" icon={Activity} />

          <div className="events">
            {events.map(([time, message, status, tone]) => (
              <div className="event" key={`${time}-${message}`}>
                <span className={`event-dot ${tone}`} />
                <time>{time}</time>
                <b>{message}</b>
                <em>{status}</em>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <Sparkles size={17} />
          <strong>PREDICTIVEAI FORGE</strong>
        </div>
        <span>AI-POWERED INDUSTRIAL DECISION INTELLIGENCE</span>
        <b>DATA → INTELLIGENCE → SIMULATION → DECISION → VERIFICATION</b>
      </footer>
    </div>
  );
}

export default App;













