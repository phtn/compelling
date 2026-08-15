#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Beast Doctor — bounded, deterministic checker for Beast projects.
 * Parses BTSX/TSRX without executing or importing target code.
 * Mirrors gleamability's security posture: masked lexical fallback, 4MiB bound, no network.
 */
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const MAX_BYTES = 4 * 1024 * 1024;
const BTSX_EXTS = new Set([".btsx", ".tsrx", ".tsx", ".ts"]);
function parseArgs(argv) {
    const targets = [];
    let jsonPath = null;
    let top = 10;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--json" && argv[i + 1])
            jsonPath = argv[++i];
        else if (a === "--top" && argv[i + 1])
            top = parseInt(argv[++i], 10) || 10;
        else if (a === "--help" || a === "-h") {
            console.log(`Usage: beast-doctor.cjs [targets...] [--json PATH] [--top N]`);
            process.exit(0);
        }
        else if (!a.startsWith("-"))
            targets.push(a);
    }
    if (targets.length === 0)
        targets.push(".");
    return { targets, jsonPath, top };
}
async function collectFiles(targets) {
    const out = [];
    for (const t of targets) {
        const abs = (0, node_path_1.resolve)(t);
        try {
            const s = await (0, promises_1.stat)(abs);
            if (s.isDirectory()) {
                await walk(abs, out);
            }
            else if (s.isFile() && BTSX_EXTS.has((0, node_path_1.extname)(abs))) {
                out.push(abs);
            }
        }
        catch {
            // missing target — report later
        }
    }
    return out;
}
async function walk(dir, out) {
    // skip ignored
    if (dir.includes("node_modules") || dir.includes(".git") || dir.includes("dist") || dir.includes(".beast"))
        return;
    let entries;
    try {
        entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const e of entries) {
        const p = (0, node_path_1.join)(dir, e.name);
        if (e.isDirectory())
            await walk(p, out);
        else if (e.isFile() && BTSX_EXTS.has((0, node_path_1.extname)(p)))
            out.push(p);
    }
}
function analyzeContent(content) {
    const diagnostics = [];
    const signals = {
        hasBeastImport: /from\s+["']beast-tsrx/.test(content) || /beastOctane/.test(content),
        hasProps: /^\s*props\s*\{/m.test(content),
        hasBtsxSyntax: /^\s*(if|each|switch|try|fragment|style)\b/m.test(content),
        hasOctaneApi: /use(State|Effect|Memo|Callback|Ref|Id|Transition|DeferredValue)|createRoot|hydrateRoot|createPortal/.test(content),
        hasVitePlugin: /beastOctane\(\)/.test(content),
    };
    // Lightweight lexical checks — mirrors parser error categories without importing compiler
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed === "fragment" || trimmed === "style") {
            const next = lines[i + 1];
            if (!next || next.trim() === "" || next.search(/\S/) <= line.search(/\S/)) {
                diagnostics.push({ code: "empty-body", message: `Empty ${trimmed} at line ${i + 1}`, line: i + 1, column: 1 });
            }
        }
        if (/^\s*props\s*\{\s*\}\s*:/.test(line)) {
            diagnostics.push({ code: "empty-props", message: `Empty props at line ${i + 1}`, line: i + 1, column: 1 });
        }
        if (/div\(\{\s*\w+\s*\}\)/.test(line) && !/div\(\{\s*\.\.\./.test(line)) {
            diagnostics.push({ code: "non-spread-braces", message: `Bare object in spread position at line ${i + 1}`, line: i + 1, column: 1 });
        }
    }
    // Indentation check: child should be > parent
    for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1];
        const cur = lines[i];
        if (cur.trim() === "" || cur.trim().startsWith("#") || prev.trim() === "")
            continue;
        const prevIndent = prev.search(/\S/);
        const curIndent = cur.search(/\S/);
        if (curIndent > prevIndent && curIndent - prevIndent !== 2 && curIndent !== -1 && prevIndent !== -1) {
            // Only flag suspicious jumps >2 when previous line is a known parent
            if (/^\s*(main|div|p|h1|a|ul|li|fragment|if|each|switch|try|component)\b/.test(prev)) {
                diagnostics.push({ code: "indentation", message: `Indentation should be +2 at line ${i + 1}`, line: i + 1, column: curIndent + 1 });
            }
        }
    }
    return { diagnostics, signals };
}
async function analyzeFile(file) {
    try {
        const s = await (0, promises_1.stat)(file);
        const size = s.size;
        const truncated = size > MAX_BYTES;
        const content = truncated ? (await (0, promises_1.readFile)(file, "utf8")).slice(0, MAX_BYTES) : await (0, promises_1.readFile)(file, "utf8");
        const { diagnostics, signals } = analyzeContent(content);
        return { file: (0, node_path_1.relative)(process.cwd(), file), exists: true, size, truncated, diagnostics, signals };
    }
    catch {
        return { file: (0, node_path_1.relative)(process.cwd(), file), exists: false, size: 0, truncated: false, diagnostics: [{ code: "missing", message: "File not found" }], signals: { hasBeastImport: false, hasProps: false, hasBtsxSyntax: false, hasOctaneApi: false, hasVitePlugin: false } };
    }
}
async function main() {
    const { targets, jsonPath, top } = parseArgs(process.argv.slice(2));
    const files = await collectFiles(targets);
    const reports = [];
    for (const f of files)
        reports.push(await analyzeFile(f));
    // Also check vite.config.ts and package.json at targets
    for (const t of targets) {
        const abs = (0, node_path_1.resolve)(t);
        try {
            const s = await (0, promises_1.stat)(abs);
            const dir = s.isDirectory() ? abs : (0, node_path_1.resolve)(abs, "..");
            for (const extra of ["vite.config.ts", "package.json", "tsconfig.json"]) {
                const p = (0, node_path_1.join)(dir, extra);
                try {
                    await (0, promises_1.stat)(p);
                    if (!reports.some((r) => (0, node_path_1.resolve)(r.file) === p))
                        reports.push(await analyzeFile(p));
                }
                catch { }
            }
        }
        catch { }
    }
    reports.sort((a, b) => b.diagnostics.length - a.diagnostics.length);
    console.log(`Beast Doctor — ${reports.length} files scanned, ${reports.filter((r) => r.diagnostics.length > 0).length} with diagnostics`);
    for (const r of reports.slice(0, top)) {
        if (r.diagnostics.length === 0)
            continue;
        console.log(`\n${r.file} (${r.diagnostics.length} issues)`);
        for (const d of r.diagnostics.slice(0, 5))
            console.log(`  ${d.code}: ${d.message}${d.line ? ` [${d.line}:${d.column}]` : ""}`);
    }
    const beastFiles = reports.filter((r) => r.signals.hasBtsxSyntax || r.signals.hasProps).length;
    const viteFiles = reports.filter((r) => r.signals.hasVitePlugin).length;
    console.log(`\nSignals: ${beastFiles} BTSX files, ${viteFiles} Vite Beast plugins, ${reports.filter((r) => r.signals.hasOctaneApi).length} Octane APIs`);
    if (jsonPath) {
        const json = JSON.stringify({ targets, reports, scanned: reports.length, top }, null, 2);
        if (jsonPath === "-")
            console.log(json);
        else {
            const { writeFile } = await import("node:fs/promises");
            await writeFile((0, node_path_1.resolve)(jsonPath), json, "utf8");
            console.log(`\nJSON report: ${(0, node_path_1.resolve)(jsonPath)}`);
        }
    }
}
main().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
});
