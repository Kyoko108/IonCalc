const app = document.querySelector('#app');

// The calculus expression is text, not a numeric quantity. Correct its input
// type after the main app renders it so mobile devices show a text keyboard.
const appObserver = new MutationObserver(() => {
  const functionInput = document.querySelector('#fn');
  if (functionInput && functionInput.type !== 'text') {
    functionInput.type = 'text';
    functionInput.inputMode = 'text';
    functionInput.autocapitalize = 'off';
    functionInput.autocomplete = 'off';
    functionInput.spellcheck = false;
  }
});
if (app) appObserver.observe(app, { childList: true, subtree: true });

// The compact 8085 teaching simulator previously advertised LDA/STA but
// deliberately stopped on either instruction. Provide direct-address memory
// semantics for these instructions (and M, the memory byte addressed by HL).
let cpu = null;
function parseValue(token) {
  const value = token.trim();
  if (/^0x[\da-f]+$/i.test(value)) return Number.parseInt(value.slice(2), 16);
  if (/^[\da-f]+h$/i.test(value)) return Number.parseInt(value.slice(0, -1), 16);
  if (/^[\da-f]*[a-f][\da-f]*$/i.test(value)) return Number.parseInt(value, 16);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid number or address: ${value}`);
  return number;
}
function start8085(editor) {
  const lines = editor.value.split(/\r?\n/).map((raw, index) => ({
    line: index + 1,
    code: raw.split(';')[0].trim()
  })).filter(row => row.code);
  cpu = {
    lines, pc: 0, halted: false, memory: new Map(),
    r: { A: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0, SP: 0xffff },
    flags: { Z: 0, S: 0, C: 0 }, log: []
  };
}
function pair(name) {
  if (name === 'SP') return cpu.r.SP;
  const high = { B: 'B', D: 'D', H: 'H' }[name];
  if (!high) throw new Error(`Invalid register pair: ${name}`);
  return (cpu.r[high] << 8) | cpu.r[{ B: 'C', D: 'E', H: 'L' }[name]];
}
function read8085(name) {
  const reg = name.toUpperCase();
  if (reg === 'M') return cpu.memory.get(pair('H')) || 0;
  if (reg in cpu.r) return cpu.r[reg];
  return parseValue(name);
}
function write8085(name, value) {
  const reg = name.toUpperCase();
  const byte = value & 0xff;
  if (reg === 'M') { cpu.memory.set(pair('H'), byte); return; }
  if (!(reg in cpu.r) || reg === 'SP') throw new Error(`Invalid 8085 register: ${name}`);
  cpu.r[reg] = byte;
}
function update8085Flags(value, carry = false) {
  const result = value & 0xff;
  cpu.flags.Z = Number(result === 0);
  cpu.flags.S = Number(Boolean(result & 0x80));
  cpu.flags.C = Number(carry);
}
function step8085() {
  if (!cpu || cpu.halted) return 'Program halted.';
  if (cpu.pc >= cpu.lines.length) { cpu.halted = true; return 'End of program.'; }
  const row = cpu.lines[cpu.pc];
  const parts = row.code.replace(/,/g, ' ').trim().split(/\s+/);
  const op = parts[0].toUpperCase(), a = parts[1], b = parts[2];
  let message = `Line ${row.line}: ${row.code}`;
  try {
    switch (op) {
      case 'HLT': cpu.halted = true; break;
      case 'MVI': write8085(a, parseValue(b)); break;
      case 'MOV': write8085(a, read8085(b)); break;
      case 'LXI': {
        const value = parseValue(b) & 0xffff;
        if (a === 'SP') cpu.r.SP = value;
        else if (['B', 'D', 'H'].includes(a)) {
          cpu.r[a] = value >> 8;
          cpu.r[{ B: 'C', D: 'E', H: 'L' }[a]] = value & 0xff;
        } else throw new Error(`Invalid LXI pair: ${a}`);
        break;
      }
      case 'LDA': cpu.r.A = cpu.memory.get(parseValue(a) & 0xffff) || 0; break;
      case 'STA': cpu.memory.set(parseValue(a) & 0xffff, cpu.r.A); break;
      case 'ADD': case 'SUB': {
        const left = cpu.r.A, right = read8085(a);
        const result = op === 'ADD' ? left + right : left - right;
        cpu.r.A = result & 0xff;
        update8085Flags(result, op === 'ADD' ? result > 0xff : result < 0);
        break;
      }
      case 'INR': case 'DCR': {
        const old = read8085(a), value = old + (op === 'INR' ? 1 : -1);
        write8085(a, value); update8085Flags(value); break;
      }
      case 'INX': case 'DCX': {
        if (!['B', 'D', 'H', 'SP'].includes(a)) throw new Error(`Invalid register pair: ${a}`);
        const value = (a === 'SP' ? cpu.r.SP : pair(a)) + (op === 'INX' ? 1 : -1);
        if (a === 'SP') cpu.r.SP = value & 0xffff;
        else { cpu.r[a] = (value >> 8) & 0xff; cpu.r[{ B: 'C', D: 'E', H: 'L' }[a]] = value & 0xff; }
        break;
      }
      case 'JMP': case 'JZ': case 'JNZ': {
        const target = parseValue(a) - 1;
        if (!Number.isInteger(target) || target < 0 || target >= cpu.lines.length) throw new Error('Jump target must be a valid 1-based instruction line.');
        if (op === 'JMP' || (op === 'JZ' && cpu.flags.Z) || (op === 'JNZ' && !cpu.flags.Z)) cpu.pc = target;
        break;
      }
      default: throw new Error(`Unsupported 8085 instruction: ${op}`);
    }
    cpu.pc++;
    cpu.log.push(message + (cpu.halted ? ' · HLT' : ''));
    return message + (cpu.halted ? ' · HLT' : '');
  } catch (error) {
    cpu.halted = true;
    return `Error at line ${row.line}: ${error.message}`;
  }
}
function render8085(editor, output, panel) {
  output.textContent = cpu.log.join('\n') + (cpu.halted ? '\n\nExecution finished.' : '');
  const memory = [...cpu.memory.entries()].sort((a, b) => a[0] - b[0]);
  panel.innerHTML = `<div class="cpu-head"><b>8085 CPU state</b><span>PC: ${cpu.pc}</span></div>
    <div class="register-grid">${Object.entries(cpu.r).map(([name, value]) => `<div><small>${name}</small><b>${value.toString(16).toUpperCase().padStart(name === 'SP' ? 4 : 2, '0')}H</b><em>${value}</em></div>`).join('')}</div>
    <div class="flag-row">${Object.entries(cpu.flags).map(([name, value]) => `<span>${name}: <b>${value}</b></span>`).join('')}</div>
    ${memory.length ? `<div class="output"><small>MEMORY</small>${memory.map(([address, value]) => `<div>${address.toString(16).toUpperCase().padStart(4, '0')}H: ${value.toString(16).toUpperCase().padStart(2, '0')}H (${value})</div>`).join('')}</div>` : ''}`;
}
function intercept8085(event) {
  const button = event.target.closest('#codeRun, #codeStep, #codeStop');
  if (!button) return;
  const selected = document.querySelector('[data-lang].active');
  if (!selected || selected.dataset.lang !== '8085') { cpu = null; return; }
  const editor = document.querySelector('#codeEditor');
  const output = document.querySelector('#codeOutput');
  const panel = document.querySelector('#cpuPanel');
  if (!editor || !output || !panel) return;
  if (button.id === 'codeStop') { cpu = null; return; }
  event.preventDefault();
  event.stopImmediatePropagation();
  if (button.id === 'codeRun' || !cpu) start8085(editor);
  if (button.id === 'codeRun') {
    for (let count = 0; count < 1000 && !cpu.halted; count++) {
      const message = step8085();
      if (message.startsWith('Error')) break;
    }
  } else {
    step8085();
  }
  render8085(editor, output, panel);
}
document.addEventListener('click', intercept8085, true);
