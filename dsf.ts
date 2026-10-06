import React, { useState, useEffect } from 'react';
import { Activity, ArrowRightLeft, Layers, ShieldCheck, Zap } from 'lucide-react';

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
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch('/results.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(() => {
        // Fallback Mock Data ถ้ายังไม่ได้ดึงไฟล์จริง
        setData([
          { mechanism: 'Pipe', size_kb: 4, iterations: 10000, elapsed_sec: 0.009, throughput_mb: 4405.88, avg_latency_us: 0.9 },
          { mechanism: 'SharedMem', size_kb: 4, iterations: 10000, elapsed_sec: 0.268, throughput_mb: 145.73, avg_latency_us: 26.8 },
          { mechanism: 'UNIX Socket', size_kb: 4, iterations: 10000, elapsed_sec: 0.035, throughput_mb: 1142.85, avg_latency_us: 3.5 },
          { mechanism: 'POSIX MQ', size_kb: 4, iterations: 10000, elapsed_sec: 0.041, throughput_mb: 975.60, avg_latency_us: 4.1 },
          { mechanism: 'Pipe', size_kb: 1024, iterations: 200, elapsed_sec: 0.122, throughput_mb: 1634.98, avg_latency_us: 611.5 },
          { mechanism: 'SharedMem', size_kb: 1024, iterations: 200, elapsed_sec: 0.024, throughput_mb: 8234.18, avg_latency_us: 121.5 },
          { mechanism: 'UNIX Socket', size_kb: 1024, iterations: 200, elapsed_sec: 0.150, throughput_mb: 1333.33, avg_latency_us: 750.0 }
        ]);
      });
  }, []);

  const filtered = data.filter(d => d.size_kb === activeSize);
  const maxThroughput = Math.max(...filtered.map(d => d.throughput_mb), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col gap-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-cyan-400">
            <Zap className="w-7 h-7" /> IPC-Bench: Linux Inter-Process Communication Visualizer
          </h1>
          <p className="text-xs text-slate-400 mt-1">POSIX System Calls: Pipes, Shared Memory, Message Queues & Sockets</p>
        </div>
        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
          {[4, 64, 1024].map(size => (
            <button
              key={size}
              onClick={() => setActiveSize(size)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeSize === size ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {size >= 1024 ? `${size / 1024} MB` : `${size} KB`} Payload
            </button>
          ))}
        </div>
      </header>

      {/* Top Section: Throughput Comparison Bars */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Throughput Benchmark ({activeSize >= 1024 ? `${activeSize / 1024} MB` : `${activeSize} KB`})
        </h2>
        <div className="flex flex-col gap-4">
          {filtered.map(item => {
            const pct = (item.throughput_mb / maxThroughput) * 100;
            return (
              <div key={item.mechanism} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.mechanism}</span>
                  <span className="font-mono text-cyan-400 font-bold">{item.throughput_mb.toFixed(2)} MB/s ({item.avg_latency_us.toFixed(1)} µs)</span>
                </div>
                <div className="w-full bg-slate-950 h-5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Section: Flow & Architecture Comparison (Zero Copy vs Kernel Copy) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Architecture 1: Pipe / Socket (Double Copy) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold mb-2">
              <Layers className="w-4 h-4" /> Pipe / Socket / MQ (Double Memory Copy)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              ข้อมูลต้องถูกคัดลอกจาก User Space ไปเก็บใน Kernel Space Buffer ก่อนถูกส่งต่อไปยัง Process ผู้รับ (Context Switching & Cache Overhead)
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2.5 text-xs text-center font-mono">
            <div className="bg-slate-800 py-1.5 rounded text-slate-300">Sender Process (User Space)</div>
            <div className="text-rose-400 text-[10px] font-bold">↓ write() / sys_send (Copy 1)</div>
            <div className="bg-rose-950/60 border border-rose-800 py-2 rounded text-rose-300 font-bold">Kernel Buffer / FIFO Queue</div>
            <div className="text-rose-400 text-[10px] font-bold">↓ read() / sys_recv (Copy 2)</div>
            <div className="bg-slate-800 py-1.5 rounded text-slate-300">Receiver Process (User Space)</div>
          </div>
        </div>

        {/* Architecture 2: Shared Memory (Zero Copy) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-2">
              <ShieldCheck className="w-4 h-4" /> Shared Memory (Direct Access / Zero Copy)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              ทั้งสอง Process แมป Virtual Address เข้ากับ Physical Memory Frame เดียวกันผ่าน Page Table เข้าถึงข้อมูลได้โดยตรงโดยไม่ต้องแวะพักใน Kernel Space
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col items-center gap-2.5 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 w-full text-center">
              <div className="bg-slate-800 py-1.5 rounded text-slate-300">Process A</div>
              <div className="bg-slate-800 py-1.5 rounded text-slate-300">Process B</div>
            </div>
            <div className="text-emerald-400 text-[10px] font-bold">↓ mmap() Direct Pointer Mapping ↓</div>
            <div className="bg-emerald-950/60 border border-emerald-800 py-4 w-full rounded text-emerald-300 font-bold text-center">
              Physical RAM (Shared Page Frame)
              <div className="text-[10px] font-normal text-slate-400 mt-1">Controlled by POSIX Semaphore</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}