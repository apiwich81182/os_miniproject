import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

app.post('/api/run-benchmark', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  // สั่งรัน C Benchmark โดยตรง (ปรับ path ให้ตรงกับที่ตั้งไฟล์)
  const proc = spawn('./ipc_benchmark_pro', [], { cwd: process.cwd() });

  proc.stdout.on('data', (data) => {
    res.write(data.toString());
  });

  proc.stderr.on('data', (data) => {
    res.write(`[Error] ${data.toString()}`);
  });

  proc.on('close', (code) => {
    res.write(`\n[Process Finished with exit code ${code}]\n`);
    // ย้าย results.json ไปไว้ที่ public อัตโนมัติหลังรันเสร็จ
    if (fs.existsSync('results.json')) {
      fs.copyFileSync('results.json', path.join('public', 'results.json'));
    }
    res.end();
  });
});

app.listen(3001, () => {
  console.log('IPC Live Runner Server listening on http://localhost:5173');
});