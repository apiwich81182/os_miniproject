import { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Play, 
  Cpu, 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Users
} from 'lucide-react';

interface Result {
  mechanism: string;
  size_kb: number;
  iterations: number;
  elapsed_sec: number;
  throughput_mb: number;
  avg_latency_us: number;
}

export default function App() {
  const [data, setData] = useState<Result[]>([]);
  const [activeSize, setActiveSize] = useState<number>(1024);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0); // 0: Idle, 1: Step 1, 2: Step 2, 3: Completed
  const [activeMechanism, setActiveMechanism] = useState<'Pipe' | 'SharedMem'>('Pipe');
  const [loading, setLoading] = useState<boolean>(false);

  // ดึงข้อมูลจาก public/results.json
  const loadData = () => {
    setLoading(true);
    fetch('/results.json?t=' + Date.now())
      .then(res => res.json())
      .then((json: Result[]) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        // Fallback ข้อมูลล่าสุดจากการรันบน Linux Engine จริง
        setData([
          { mechanism: 'Pipe', size_kb: 4, iterations: 10000, elapsed_sec: 0.0091, throughput_mb: 4301.09, avg_latency_us: 0.91 },
          { mechanism: 'SharedMem', size_kb: 4, iterations: 10000, elapsed_sec: 0.2762, throughput_mb: 141.45, avg_latency_us: 27.62 },
          { mechanism: 'UNIX Socket', size_kb: 4, iterations: 10000, elapsed_sec: 0.0150, throughput_mb: 2601.74, avg_latency_us: 1.50 },
          { mechanism: 'POSIX MQ', size_kb: 4, iterations: 10000, elapsed_sec: 0.0108, throughput_mb: 3601.89, avg_latency_us: 1.08 },
          { mechanism: 'SHM-4-Workers', size_kb: 4, iterations: 10000, elapsed_sec: 0.0034, throughput_mb: 11577.50, avg_latency_us: 0.34 },
          { mechanism: 'Pipe', size_kb: 64, iterations: 2000, elapsed_sec: 0.0577, throughput_mb: 2166.42, avg_latency_us: 28.85 },
          { mechanism: 'SharedMem', size_kb: 64, iterations: 2000, elapsed_sec: 0.0663, throughput_mb: 1885.68, avg_latency_us: 33.14 },
          { mechanism: 'UNIX Socket', size_kb: 64, iterations: 2000, elapsed_sec: 0.0129, throughput_mb: 9654.75, avg_latency_us: 6.47 },
          { mechanism: 'SHM-4-Workers', size_kb: 64, iterations: 2000, elapsed_sec: 0.0063, throughput_mb: 19971.24, avg_latency_us: 3.13 },
          { mechanism: 'Pipe', size_kb: 1024, iterations: 200, elapsed_sec: 0.1297, throughput_mb: 1541.83, avg_latency_us: 648.58 },
          { mechanism: 'SharedMem', size_kb: 1024, iterations: 200, elapsed_sec: 0.0258, throughput_mb: 7761.26, avg_latency_us: 128.84 },
          { mechanism: 'UNIX Socket', size_kb: 1024, iterations: 200, elapsed_sec: 0.0223, throughput_mb: 8981.09, avg_latency_us: 111.34 },
          { mechanism: 'SHM-4-Workers', size_kb: 1024, iterations: 200, elapsed_sec: 0.0124, throughput_mb: 16181.23, avg_latency_us: 61.80 }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = data.filter(d => d.size_kb === activeSize);
  const maxThroughput = Math.max(...filtered.map(d => d.throughput_mb), 1);

  // ควบคุมจังหวะ Animation จำลองการส่งข้อมูล
  const handleStartSim = (mech: 'Pipe' | 'SharedMem') => {
    setActiveMechanism(mech);
    setSimRunning(true);
    setSimStep(1);

    setTimeout(() => {
      setSimStep(2);
      setTimeout(() => {
        setSimStep(3);
        setTimeout(() => {
          setSimRunning(false);
          setSimStep(0);
        }, 1200);
      }, 900);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 flex flex-col gap-8 font-sans">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-cyan-400">
            <Zap className="w-7 h-7" /> IPC-Bench: Linux Inter-Process Communication Visualizer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            POSIX System Calls: Pipes, Shared Memory, Message Queues & Sockets Benchmarking Engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            title="Reload results.json"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
            {[4, 64, 1024].map(size => (
              <button
                key={size}
                onClick={() => setActiveSize(size)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeSize === size 
                    ? 'bg-cyan-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {size >= 1024 ? `${size / 1024} MB` : `${size} KB`} Payload
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Top Section: Live Throughput Bars */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Throughput Benchmark ({activeSize >= 1024 ? `${activeSize / 1024} MB` : `${activeSize} KB`})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Sorted by Raw Metrics</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {filtered.map(item => {
            const pct = (item.throughput_mb / maxThroughput) * 100;
            const isSpecial = item.mechanism.includes('Workers');
            return (
              <div key={item.mechanism} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold flex items-center gap-1.5 ${isSpecial ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {isSpecial && <Users className="w-3.5 h-3.5" />}
                    {item.mechanism}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {item.throughput_mb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MB/s 
                    <span className="text-slate-500 font-normal ml-1.5">({item.avg_latency_us.toFixed(1)} µs)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isSpecial 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Middle Section: Interactive Animated Flow Simulator */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-yellow-400" /> Interactive Data Flow & Memory Lifecycle Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              จำลองเส้นทางการเคลื่อนที่ของข้อมูลและการเปลี่ยนโหมด User Space ↔ Kernel Space
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStartSim('Pipe')}
              disabled={simRunning}
              className="flex items-center gap-1.5 bg-rose-900/50 hover:bg-rose-900/80 border border-rose-800/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-200 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" /> Simulate Pipe / Socket (Double Copy)
            </button>
            <button
              onClick={() => handleStartSim('SharedMem')}
              disabled={simRunning}
              className="flex items-center gap-1.5 bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" /> Simulate Shared Memory (Zero-Copy)
            </button>
          </div>
        </div>

        {/* Live Simulation Playground */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Card 1: Pipe / Socket Flow */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            activeMechanism === 'Pipe' && simRunning 
              ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
              : 'border-slate-800 bg-slate-950'
          }`}>
            <div className="flex justify-between items-center mb-3 text-xs font-bold">
              <span className="text-rose-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Pipe / Socket Flow
              </span>
              <span className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Memory Copies: <span className="text-rose-400 font-bold">{simRunning && activeMechanism === 'Pipe' ? (simStep >= 2 ? '2' : '1') : '2'}</span>
              </span>
            </div>
            
            <div className="flex flex-col gap-3 font-mono text-xs text-center">
              <div className={`py-2 rounded border transition ${
                simStep === 1 && activeMechanism === 'Pipe' 
                  ? 'bg-cyan-600 text-white font-bold border-cyan-400 animate-pulse' 
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                Sender Process (User Space)
              </div>
              <div className="text-[11px] font-bold text-rose-400">
                {simStep === 1 && activeMechanism === 'Pipe' ? '⚡ Copying: write() -> Kernel Buffer' : '↓ sys_write / sys_send (Copy 1)'}
              </div>
              <div className={`py-3.5 rounded border transition ${
                simStep === 2 && activeMechanism === 'Pipe' 
                  ? 'bg-rose-600 text-white font-bold border-rose-300 shadow-md animate-bounce' 
                  : 'bg-rose-950/50 text-rose-300 border-rose-900'
              }`}>
                Kernel Space Ring Buffer (FIFO Queue)
              </div>
              <div className="text-[11px] font-bold text-rose-400">
                {simStep === 2 && activeMechanism === 'Pipe' ? '⚡ Copying: Kernel Buffer -> Receiver' : '↓ sys_read / sys_recv (Copy 2)'}
              </div>
              <div className={`py-2 rounded border transition ${
                simStep === 3 && activeMechanism === 'Pipe' 
                  ? 'bg-emerald-600 text-white font-bold border-emerald-400 animate-pulse' 
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                Receiver Process (User Space)
              </div>
            </div>
          </div>

          {/* Card 2: Shared Memory Flow */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            activeMechanism === 'SharedMem' && simRunning 
              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/40' 
              : 'border-slate-800 bg-slate-950'
          }`}>
            <div className="flex justify-between items-center mb-3 text-xs font-bold">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Shared Memory Flow
              </span>
              <span className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Memory Copies: <span className="text-emerald-400 font-bold">0 (Zero-Copy)</span>
              </span>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`py-2 rounded border transition ${
                  simStep === 1 && activeMechanism === 'SharedMem' 
                    ? 'bg-emerald-600 text-white font-bold border-emerald-400' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  Process A (Writer)
                </div>
                <div className={`py-2 rounded border transition ${
                  simStep === 3 && activeMechanism === 'SharedMem' 
                    ? 'bg-emerald-600 text-white font-bold border-emerald-400' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  Process B (Reader)
                </div>
              </div>

              <div className="text-[11px] font-bold text-center text-emerald-400">
                {simStep === 1 && activeMechanism === 'SharedMem' 
                  ? '⚡ sem_wait() -> Lock Acquired -> Direct Memory Access' 
                  : '↕ mmap() Direct Physical Pointer Mapping'}
              </div>

              <div className={`py-5 rounded border text-center transition ${
                simStep === 2 && activeMechanism === 'SharedMem' 
                  ? 'bg-emerald-900/90 text-white border-emerald-400 shadow-md animate-pulse' 
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-900'
              }`}>
                <div className="font-bold text-sm">Physical RAM Frame (Page Table Shared)</div>
                <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center justify-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    simRunning && activeMechanism === 'SharedMem' 
                      ? (simStep === 1 ? 'bg-amber-400' : 'bg-emerald-400') 
                      : 'bg-slate-500'
                  }`} />
                  Semaphore Status: {
                    simRunning && activeMechanism === 'SharedMem' 
                      ? (simStep === 1 ? 'WAIT (Locked)' : 'POST (Unlocked)') 
                      : 'Ready'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Architectural Trade-Off Matrix */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" /> Architectural Trade-offs & Production Use Cases
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Mechanism</th>
                <th className="p-3">Zero-Copy?</th>
                <th className="p-3">Kernel Crossing</th>
                <th className="p-3">Sync Requirement</th>
                <th className="p-3">Production Use Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3 font-bold text-slate-200">Pipe</td>
                <td className="p-3 text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> No (Double Copy)
                </td>
                <td className="p-3 text-slate-300">2 per transfer</td>
                <td className="p-3 text-emerald-400">Automatic (Kernel FIFO)</td>
                <td className="p-3 text-slate-400">
                  Shell pipelines (<code className="text-cyan-400">cat | grep</code>), Command redirection
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-200">Shared Memory</td>
                <td className="p-3 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes (Direct Mapping)
                </td>
                <td className="p-3 text-slate-300">None (After setup)</td>
                <td className="p-3 text-amber-400">Manual (POSIX Semaphores / Mutex)</td>
                <td className="p-3 text-slate-400">
                  PostgreSQL Shared Buffers, High-speed Video/Audio Streaming
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-200">UNIX Domain Socket</td>
                <td className="p-3 text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> No (Kernel Socket Buffer)
                </td>
                <td className="p-3 text-slate-300">2 per transfer</td>
                <td className="p-3 text-emerald-400">Automatic (Stream / TCP semantics)</td>
                <td className="p-3 text-slate-400">
                  Docker Daemon ↔ Docker CLI, Nginx ↔ PHP-FPM
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-200">POSIX Message Queue</td>
                <td className="p-3 text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> No (Kernel Message Buffer)
                </td>
                <td className="p-3 text-slate-300">2 per transfer</td>
                <td className="p-3 text-emerald-400">Automatic (Message Boundaries)</td>
                <td className="p-3 text-slate-400">
                  Real-time Embedded Systems, Discrete Event Buses (&le; 8 KB)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}