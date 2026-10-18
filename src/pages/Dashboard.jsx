import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../auth/AuthService";
import useSystemData from "../hooks/useSystemData";

const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) =>
  "#" +
  hex(a)
    .map((v, i) =>
      Math.round(v + (hex(b)[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const heat = (p) =>
  p < 50
    ? mix("#6fbf5f", "#d9d24a", p / 50)
    : mix("#d9d24a", "#e0503f", (p - 50) / 50);

const Meter = ({ pct = 0, width = 10, gradient = heat, solid }) => {
  const filled = Math.round((clamp(pct) / 100) * width);
  return (
    <span className="bt-meter">
      {Array.from({ length: width }, (_, i) => (
        <span
          key={i}
          style={{
            color:
              i < filled
                ? solid || gradient(((i + 1) / width) * 100)
                : "#2e2e2e",
          }}
        >
          ■
        </span>
      ))}
    </span>
  );
};

const Bar = ({ pct, color }) => (
  <span className="bt-bar">
    <i style={{ width: `${clamp(pct)}%`, background: color }} />
  </span>
);

/* Panel with titles sitting on the border: title */
const Box = ({ titles = [], right = [], className = "", style, children }) => (
  <section className={`bt-box ${className}`} style={style}>
    <div className="bt-titles left">
      {titles.map((t, i) => (
        <span key={i} className="bt-title">
          <b>┐</b>
          {t}
          <b>┌</b>
        </span>
      ))}
    </div>
    <div className="bt-titles right">
      {right.map((t, i) => (
        <span key={i} className="bt-title">
          <b>┐</b>
          {t}
          <b>┌</b>
        </span>
      ))}
    </div>
    {children}
  </section>
);

/* Block-cell graph: columns snapped to rows, dotted empty area */
const Graph = ({ values, rows = 10, gradient, flip = false, style }) => {
  const bg =
    gradient ||
    "linear-gradient(to top,#6fbf5f 0%,#6fbf5f 55%,#d9d24a 75%,#e8883a 90%,#e0503f 100%)";
  return (
    <div
      className="bt-graph"
      style={{
        "--r": rows,
        transform: flip ? "scaleY(-1)" : undefined,
        ...style,
      }}
    >
      {values.map((v, i) => {
        const lit = Math.ceil((clamp(v) / 100) * rows);
        return (
          <div
            key={i}
            style={{
              background: bg,
              clipPath: `inset(${100 - (lit / rows) * 100}% 0 0 0)`,
            }}
          />
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useSystemData();

  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [cpuHist, setCpuHist] = useState(() => Array(90).fill(20));
  const [gpuHist, setGpuHist] = useState(() => Array(90).fill(10));
  const [rxHist, setRxHist] = useState(() => Array(36).fill(0));
  const [txHist, setTxHist] = useState(() => Array(36).fill(0));

  useEffect(() => {
    const s = data?.sensors;
    if (!s) return;
    if (s.cpuLoad !== undefined) setCpuHist((p) => [...p.slice(1), s.cpuLoad]);
    setGpuHist((p) => [...p.slice(1), s.gpuLoad ?? 13]);
    setRxHist((p) => [...p.slice(1), s.netDownPct ?? Math.random() * 60]);
    setTxHist((p) => [...p.slice(1), s.netUpPct ?? Math.random() * 40]);
  }, [data]);

  const logout = async () => {
    await AuthService.signOut();
    navigate("/signin");
  };

  /* ---- values  ---- */
  const s = data?.sensors || {};
  const memTotal = Number(s.memTotalGB ?? "N/A");
  const memUsed = Number(s.memUsedGB ?? "N/A");
  const memAvail = +(memTotal - memUsed).toFixed(2);
  const cpuNow = Math.round(s.cpuLoad ?? cpuHist[cpuHist.length - 1]);
  const cores = s.cores ?? [50, 47, 48, 58];
  const procs = useMemo(
    () =>
      data?.tasks?.length
        ? data.tasks.map((t) => [
            t.pid,
            t.name,
            t.command ?? t.name,
            t.threads ?? "",
            t.user ?? "N/A",
            t.mem,
            t.cpu,
          ])
        : [],
    [data],
  );

  //   Network =
  const n = data?.network || {};
  const ipv4 = n.ipv4 || "";

  // System
  const sys = data?.system || {};
  const cpuBrand = sys.cpuBrand;

  if (isLoading && !data) {
    return (
      <div className="bt-root">
        {/* <style>{CSS}</style> */}
        <span style={{ color: "#6fd3d6" }}>Loading btop...</span>
      </div>
    );
  }

  return (
    <div className="bt-root">
      {/* <style>{CSS}</style> */}

      <div className="bt-grid">
        <Box
          className="a-cpu"
          titles={[<em key="1">cpu</em>, "menu", "preset *"]}
          right={[]}
        >
          <div className="bt-topmid">
            <span className="bt-title">
              <b>┐</b>
              {clock.toLocaleTimeString("en-GB")}
              <b>┌</b>
            </span>
          </div>
          <div className="bt-topright">
            <span className="bt-title">
              <b>┐</b>BAT <span style={{ color: "#6fbf5f" }}>100%</span>{" "}
              <Meter pct={100} width={6} solid="#6fbf5f" />
              <b>┌</b>
            </span>
          </div>

          <div className="bt-cpu-inner">
            <Graph values={cpuHist} rows={11} style={{ flex: 1 }} />
            <div className="bt-sep">
              <span>cpu ▲▼ gpu</span>
            </div>
            <Graph
              values={gpuHist}
              rows={3}
              flip
              gradient="linear-gradient(to top,#3a3a3a,#3a3a3a)"
              style={{ height: 34 }}
            />
            <div className="bt-up">up 03:38:59</div>
          </div>
        </Box>

        {/* ═════════ CPU CORES ═════════ */}
        <Box
          className="a-cores"
          titles={[]}
          right={["i5-6200U", "2.7 GHz"]}
          style={{ paddingTop: 2 }}
        >
          <div className="bt-cores">
            <div className="bt-core">
              <span className="l">CPU</span>
              <Meter pct={cpuNow} width={10} />
              <span className="p">{cpuNow}%</span>
              <span className="t" style={{ color: "#6fd3d6" }}>
                ▒▒▒▒
              </span>
              <span className="t">48°C</span>
            </div>
            {cores.map((c, i) => (
              <div className="bt-core" key={i}>
                <span className="l">C{i}</span>
                <Meter pct={c} width={10} />
                <span className="p">{Math.round(c)}%</span>
                <span className="t" style={{ color: "#6fd3d6" }}>
                  ▒▒▒▒
                </span>
                <span className="t">{47 + (i % 2)}°C</span>
              </div>
            ))}
            <div className="bt-load">
              <span>Load AVG:</span>
              <b>1.40</b>
              <b>1.44</b>
              <b>3.05</b>
            </div>
            <div className="bt-core" style={{ marginTop: 2 }}>
              <span className="l">GPU</span>
              <Meter pct={gpuHist[gpuHist.length - 1]} width={10} />
              <span className="p">
                {Math.round(gpuHist[gpuHist.length - 1])}%
              </span>
            </div>
            <div style={{ color: "#8fd0d4", paddingLeft: 40 }}>
              HD Graphics 520
            </div>
          </div>
        </Box>

        {/* ═════════ MEM ═════════ */}
        <Box className="a-mem" titles={[<em key="m">mem</em>]}>
          <div className="bt-memrows">
            {[
              ["Total:", null, `${memTotal.toFixed(1)} GiB`],
              [
                "Used:",
                [(memUsed / memTotal) * 100, "#d9606f"],
                `${memUsed.toFixed(2)} GiB`,
              ],
              [
                "Avail:",
                [(memAvail / memTotal) * 100, "#6fbf5f"],
                `${memAvail.toFixed(2)} GiB`,
              ],
              ["Cache:", [41, "#4a9ca0"], "6.48 GiB"],
              ["Commit:", [76, "#e8c93a"], "12.0 GiB"],
            ].map(([l, b, v]) => (
              <div className="r" key={l}>
                <span>{l}</span>
                {b ? (
                  <Bar pct={b[0]} color={b[1]} />
                ) : (
                  <span className="grow" />
                )}
                <span className="v">{v}</span>
              </div>
            ))}
          </div>
          <hr />
          <div className="bt-memrows">
            <div className="r">
              <span>GPU Shared:</span>
              <span className="grow" />
              <span className="v">7.93 GiB</span>
            </div>
            <div className="r">
              <span>Used</span>
              <Bar pct={3} color="#d9606f" />
              <span className="v">280 MiB</span>
            </div>
            <div className="r">
              <span>Page+Virt:</span>
              <span className="grow" />
              <span className="v">11.3 GiB</span>
            </div>
            <div className="r">
              <span>Used</span>
              <Bar pct={33} color="#d9606f" />
              <span className="v">3.75 GiB</span>
            </div>
          </div>
        </Box>

        {/* ═════════ DISKS ═════════ */}
        <Box
          className="a-disk"
          titles={[<em key="d">disks</em>]}
          right={["io"]}
        >
          <div className="bt-memrows">
            <div className="r">
              <span>C:</span>
              <span
                className="grow"
                style={{ textAlign: "center", color: "#888" }}
              >
                ▼▲11M
              </span>
              <span className="v">237 GiB</span>
            </div>
            <div className="r">
              <span>10%</span>
              <Bar pct={10} color="#4a9ca0" />
            </div>
          </div>
          <hr />
          <div className="bt-memrows">
            <div className="r">
              <span>Free: 50%</span>
              <Bar pct={50} color="#6fbf5f" />
              <span className="v">118 GiB</span>
            </div>
            <div className="r">
              <span>Used: 50%</span>
              <Bar pct={50} color="#d9606f" />
              <span className="v">118 GiB</span>
            </div>
          </div>
        </Box>

        {/* ═════════ NET ═════════ */}
        <Box className="a-net" titles={[<em key="n">net</em>]} right={[ipv4]}>
          <div className="bt-netwrap">
            <div className="bt-netgraph">
              <Graph
                values={rxHist}
                rows={7}
                gradient="linear-gradient(to top,#6d4aa8,#b46fd0 60%,#e58fc9)"
                style={{ flex: 1 }}
              />
              <Graph
                values={txHist}
                rows={7}
                flip
                gradient="linear-gradient(to top,#6d4aa8,#b46fd0 60%,#e58fc9)"
                style={{ flex: 1 }}
              />
            </div>
            <div className="bt-netinfo">
              <div className="hd">download</div>
              <div>
                ▼ 0 Byte/s <span>(0 bitps)</span>
              </div>
              <div>
                ▼ Total: <span className="w">3.65 GiB</span>
              </div>
              <div className="gap" />
              <div>
                ▲ 49 Byte/s <span>(392 bitps)</span>
              </div>
              <div>
                ▲ Total: <span className="w">99.4 MiB</span>
              </div>
              <div className="hd">upload</div>
            </div>
          </div>
          <div className="bt-netfoot">
            <b>┐</b>sync<b>┌</b>
            <b>┐</b>auto<b>┌</b>
            <b>┐</b>zero<b>┌</b>
          </div>
        </Box>

        {/* ═════════ PROC ═════════ */}
        <Box
          className="a-proc"
          titles={[
            <em key="p">proc</em>,
            "filter",
            "per-core",
            "reverse",
            "tree",
          ]}
          right={["< cpu lazy >"]}
        >
          <div className="bt-th">
            <span>Pid:</span>
            <span>Program:</span>
            <span>Command:</span>
            <span className="r">Threads:</span>
            <span>User:</span>
            <span className="r">MemB</span>
            <span className="r cpu">Cpu% ↓</span>
          </div>
          <div className="bt-tbody">
            {procs.map((p, i) => (
              <div
                className={`bt-tr ${i === 0 ? "sel" : ""}`}
                key={`${p[0]}-${i}`}
              >
                <span>{p[0]}</span>
                <span className="prog">{p[1]}</span>
                <span className="cmd">{p[2]}</span>
                <span className="r">{p[3]}</span>
                <span className="usr">{p[4]}</span>
                <span className="r">
                  {typeof p[5] === "number" ? `${Math.round(p[5])}M` : p[5]}
                </span>
                <span
                  className="r"
                  style={{ color: heat(Math.min(100, p[6] * 25)) }}
                >
                  {Number(p[6]).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="bt-foot">
            <span>
              <b>┐</b>select<b>┌</b>
              <b>┐</b>info<b>┌</b>
              <b>┐</b>terminate<b>┌</b>
            </span>
            <span onClick={logout} style={{ cursor: "pointer" }}>
              <b>┐</b>0/{procs.length}
              <b>┌</b>
            </span>
          </div>
        </Box>
      </div>
    </div>
  );
}
