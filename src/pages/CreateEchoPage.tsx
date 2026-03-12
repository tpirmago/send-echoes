import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ECHO_TYPES, ECHO_CONFIG } from '../utils/echoConfig';
import { useCreateEcho } from '../hooks/useCreateEcho';
import type { EchoType } from '../types/echo';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ACCEPTED = 'image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface FormData {
  type: EchoType;
  title: string;
  content: string;
  unlockMode: 'specific' | 'random';
  unlockDate: string;
  unlockDateFrom: string;
  unlockDateTo: string;
  recipientEmail: string;
  files: File[];
}

const MIN_DATE = new Date().toISOString().split('T')[0];

const STEP_LABELS = ['Choose type', 'Write', 'Seal'];

export function CreateEchoPage() {
  const navigate = useNavigate();
  const { mutateAsync: createEcho, isPending, error } = useCreateEcho();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>({
    type: 'myself',
    title: '',
    content: '',
    unlockMode: 'specific',
    unlockDate: '',
    unlockDateFrom: '',
    unlockDateTo: '',
    recipientEmail: '',
    files: [],
  });

  const go = (next: 1 | 2 | 3) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      let unlockAt: Date;
      if (form.unlockMode === 'random') {
        const from = new Date(form.unlockDateFrom).getTime();
        const to = new Date(form.unlockDateTo).getTime();
        unlockAt = new Date(from + Math.random() * (to - from));
      } else {
        unlockAt = new Date(form.unlockDate);
      }
      const result = await createEcho({
        type: form.type,
        title: form.title,
        content: form.content,
        unlockAt,
        recipientEmail: form.recipientEmail || undefined,
        files: form.files,
      });
      if (result.failedFiles.length > 0) {
        setUploadWarning(
          `Echo saved, but ${result.failedFiles.length} file(s) failed to upload: ${result.failedFiles.join(', ')}. Check the Supabase Storage bucket "echo-attachments" setup.`
        );
        return; // stay on page so user sees the warning
      }
      navigate('/echoes', { state: { newEchoType: form.type } });
    } catch {
      // error is shown via `error` from useMutation
    }
  };

  const canAdvanceStep2 = form.title.trim().length >= 2;
  const canSubmit = !isPending && (
    form.unlockMode === 'specific'
      ? !!form.unlockDate
      : !!form.unlockDateFrom && !!form.unlockDateTo && form.unlockDateFrom < form.unlockDateTo
  );

  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
  };

  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, position: 'relative' }}>
        {/* Close button */}
        <button
          onClick={() => navigate('/echoes')}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 20,
            lineHeight: 1,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          ×
        </button>

        {/* Step indicator */}
        <div style={stepBarStyle}>
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = n === step;
            const done = n < step;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    background: done ? '#22C55E' : active ? '#1a1a2e' : '#e5e7eb',
                    color: done || active ? '#fff' : '#9ca3af',
                    transition: 'all 0.2s',
                  }}
                >
                  {done ? '✓' : n}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1a1a2e' : '#9ca3af',
                  }}
                >
                  {label}
                </span>
                {i < 2 && <div style={{ width: 32, height: 1, background: '#e5e7eb', margin: '0 4px' }} />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div style={{ overflow: 'hidden', minHeight: 380, padding: '8px 8px', margin: '-8px -8px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {step === 1 && (
                <Step1
                  selected={form.type}
                  onSelect={(type) => { setForm((f) => ({ ...f, type })); go(2); }}
                />
              )}
              {step === 2 && (
                <Step2
                  title={form.title}
                  content={form.content}
                  type={form.type}
                  files={form.files}
                  onChange={(field, val) => setForm((f) => ({ ...f, [field]: val }))}
                  onFilesChange={(files) => setForm((f) => ({ ...f, files }))}
                />
              )}
              {step === 3 && (
                <Step3
                  unlockMode={form.unlockMode}
                  unlockDate={form.unlockDate}
                  unlockDateFrom={form.unlockDateFrom}
                  unlockDateTo={form.unlockDateTo}
                  recipientEmail={form.recipientEmail}
                  type={form.type}
                  onChange={(field, val) => setForm((f) => ({ ...f, [field]: val }))}
                  error={error instanceof Error ? error.message : null}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Upload warning */}
        {uploadWarning && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#fef3c7', borderRadius: 10, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            ⚠️ {uploadWarning}
            <button
              onClick={() => navigate('/echoes', { state: { newEchoType: form.type } })}
              style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Continue to My Echoes anyway →
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <button
            style={backBtnStyle}
            onClick={() => (step === 1 ? navigate('/echoes') : go((step - 1) as 1 | 2 | 3))}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step === 2 ? (
            <button
              style={nextBtnStyle(canAdvanceStep2)}
              disabled={!canAdvanceStep2}
              onClick={() => go(3)}
            >
              Next →
            </button>
          ) : step === 3 ? (
            <button
              style={nextBtnStyle(canSubmit)}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isPending ? 'Sending…' : 'Send Echo'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Choose type ──────────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: EchoType; onSelect: (t: EchoType) => void }) {
  return (
    <div>
      <h2 style={stepHeadingStyle}>What kind of Echo is this?</h2>
      <p style={stepSubStyle}>Each type has its own energy and colour</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
          marginTop: 24,
        }}
      >
        {ECHO_TYPES.map((type) => {
          const cfg = ECHO_CONFIG[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              style={{
                border: isSelected ? `2px solid ${cfg.color}` : '2px solid #e5e7eb',
                borderRadius: 16,
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#fff',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isSelected ? `0 4px 16px ${cfg.color}33` : 'none',
              }}
            >
              <div style={{ height: 56, background: isSelected ? cfg.gradient : cfg.softGradient }} />
              <div style={{ padding: '12px 16px 16px', textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', lineHeight: 1.3, display: 'block', marginBottom: 4 }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: 'block' }}>
                  {cfg.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Write content ────────────────────────────────────────────────────

function Step2({
  title,
  content,
  type,
  files,
  onChange,
  onFilesChange,
}: {
  title: string;
  content: string;
  type: EchoType;
  files: File[];
  onChange: (field: 'title' | 'content', val: string) => void;
  onFilesChange: (files: File[]) => void;
}) {
  const cfg = ECHO_CONFIG[type];
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: cfg.softGradient,
          borderRadius: 999,
          padding: '4px 14px 4px 8px',
          marginBottom: 20,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{cfg.label}</span>
      </div>

      <h2 style={stepHeadingStyle}>Write your message</h2>
      <p style={stepSubStyle}>
        Once sent, this Echo is sealed. You won't be able to edit it
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input
            value={title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Give your Echo a name…"
            maxLength={80}
            style={inputStyle}
            autoFocus
          />
        </div>

        {type === 'voice' ? (
          <VoiceRecorder
            files={files}
            onFilesChange={onFilesChange}
            accentColor={cfg.color}
          />
        ) : (
          <>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={content}
                onChange={(e) => onChange('content', e.target.value)}
                placeholder="Write to your future self, a loved one, or the world…"
                maxLength={4000}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af', float: 'right', marginTop: 4 }}>
                {content.length}/4000
              </span>
            </div>
            {type !== 'goals' && (
              <div style={{ clear: 'both' }}>
                <label style={labelStyle}>
                  Attachments{' '}
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional, max {MAX_FILES} files · 3 MB · images auto-compressed)</span>
                </label>
                <FileAttachmentPicker files={files} onChange={onFilesChange} accentColor={cfg.color} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── FileAttachmentPicker ─────────────────────────────────────────────────────

function FileAttachmentPicker({
  files,
  onChange,
  accentColor,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  accentColor: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs on unmount to avoid memory leaks
  const previewUrls = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const getPreviewUrl = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return null;
    const key = file.name + file.size;
    if (!previewUrls.current.has(key)) {
      previewUrls.current.set(key, URL.createObjectURL(file));
    }
    return previewUrls.current.get(key)!;
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setError(null);
    const toAdd: File[] = [];
    for (const file of Array.from(incoming)) {
      if (files.length + toAdd.length >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        break;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 10 MB limit.`);
        continue;
      }
      // Avoid duplicates by name+size
      const isDup = files.some((f) => f.name === file.name && f.size === file.size);
      if (!isDup) toAdd.push(file);
    }
    if (toAdd.length > 0) onChange([...files, ...toAdd]);
  };

  const remove = (index: number) => {
    const file = files[index];
    const key = file.name + file.size;
    const url = previewUrls.current.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(key);
    }
    onChange(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? accentColor : '#d1d5db'}`,
          borderRadius: 12,
          padding: '18px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? `${accentColor}08` : '#fafafa',
          transition: 'border-color 0.15s, background 0.15s',
          display: files.length >= MAX_FILES ? 'none' : 'block',
        }}
      >
        <span style={{ fontSize: 22 }}>📎</span>
        <p style={{ margin: '6px 0 2px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
          Click or drag files here
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
          Images, PDF, Word, TXT
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Add more button when zone is hidden */}
      {files.length > 0 && files.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            marginTop: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 12,
            color: accentColor,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Add more
        </button>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {files.map((file, i) => {
            const preview = getPreviewUrl(file);
            return (
              <div
                key={file.name + i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {file.type === 'application/pdf' ? '📄' : '📝'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 4,
                    flexShrink: 0,
                  }}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── VoiceRecorder ─────────────────────────────────────────────────────────────

function VoiceRecorder({
  files,
  onFilesChange,
  accentColor,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accentColor: string;
}) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'm4a';
        const file = new File([blob], `voice-echo-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Replace any previous voice recording in files
        onFilesChange([...files.filter((f) => !f.name.startsWith('voice-echo-')), file]);
        setStatus('done');
      };
      recorder.start();
      mediaRef.current = recorder;
      setSeconds(0);
      setStatus('recording');
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRef.current?.stop();
  };

  const reRecord = () => {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    onFilesChange(files.filter((f) => !f.name.startsWith('voice-echo-')));
    setSeconds(0);
    setStatus('idle');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (mp3, m4a, wav, ogg, etc.).');
      e.target.value = '';
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    onFilesChange([...files.filter((f) => !f.name.startsWith('voice-echo-')), file]);
    setStatus('done');
    e.target.value = '';
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div>
      <label style={labelStyle}>Voice recording</label>
      <div
        style={{
          border: `2px ${status === 'recording' ? 'solid' : 'dashed'} ${status === 'recording' ? accentColor : '#e5e7eb'}`,
          borderRadius: 16,
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          background: status === 'recording' ? `${accentColor}08` : '#fafafa',
          transition: 'all 0.2s',
        }}
      >
        {status === 'idle' && (
          <>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
              Record live or upload an audio file
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={startRecording}
                style={{
                  background: accentColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Record
              </button>
              <button
                onClick={() => uploadRef.current?.click()}
                style={{
                  background: 'none',
                  border: `1.5px solid ${accentColor}`,
                  borderRadius: 999,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: accentColor,
                  cursor: 'pointer',
                }}
              >
                Upload file
              </button>
            </div>
            <input
              ref={uploadRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
          </>
        )}

        {status === 'recording' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1s infinite',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#1a1a2e' }}>
                {fmt(seconds)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Recording…</p>
            <button
              onClick={stopRecording}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          </>
        )}

        {status === 'done' && audioUrl && (
          <>
            <div style={{ fontSize: 28 }}>✓</div>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Recording saved — {fmt(seconds)}</p>
            <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 320 }} />
            <button
              onClick={reRecord}
              style={{
                background: 'none',
                border: '1.5px solid #e5e7eb',
                borderRadius: 999,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 500,
                color: '#6b7280',
                cursor: 'pointer',
              }}
            >
              Re-record
            </button>
          </>
        )}
      </div>

      {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{error}</p>}
    </div>
  );
}

// ── Step 3: Seal ─────────────────────────────────────────────────────────────

function Step3({
  unlockMode,
  unlockDate,
  unlockDateFrom,
  unlockDateTo,
  type,
  onChange,
  error,
}: {
  unlockMode: 'specific' | 'random';
  unlockDate: string;
  unlockDateFrom: string;
  unlockDateTo: string;
  recipientEmail: string;
  type: EchoType;
  onChange: (field: keyof FormData, val: string) => void;
  error: string | null;
}) {
  const cfg = ECHO_CONFIG[type];
  return (
    <div>
      <h2 style={stepHeadingStyle}>Seal your Echo</h2>
      <p style={stepSubStyle}>Choose when it unlocks.</p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 24 }}>
        {(['specific', 'random'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange('unlockMode', mode)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 12,
              border: unlockMode === mode ? `2px solid ${cfg.color}` : '2px solid #e5e7eb',
              background: unlockMode === mode ? `${cfg.color}12` : '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: unlockMode === mode ? cfg.color : '#6b7280',
              transition: 'all 0.15s',
            }}
          >
            {mode === 'specific' ? 'Specific date' : 'Random moment'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {unlockMode === 'specific' ? (
          <div>
            <label style={labelStyle}>Unlock date *</label>
            <input
              type="date"
              value={unlockDate}
              min={MIN_DATE}
              onChange={(e) => onChange('unlockDate', e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              style={{ ...inputStyle, borderColor: unlockDate ? cfg.color : '#e5e7eb', cursor: 'pointer' }}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
              The Echo will be readable on this date.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label style={labelStyle}>Earliest date *</label>
              <input
                type="date"
                value={unlockDateFrom}
                min={MIN_DATE}
                onChange={(e) => onChange('unlockDateFrom', e.target.value)}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                style={{ ...inputStyle, borderColor: unlockDateFrom ? cfg.color : '#e5e7eb', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Latest date *</label>
              <input
                type="date"
                value={unlockDateTo}
                min={unlockDateFrom || MIN_DATE}
                onChange={(e) => onChange('unlockDateTo', e.target.value)}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                style={{ ...inputStyle, borderColor: unlockDateTo ? cfg.color : '#e5e7eb', cursor: 'pointer' }}
              />
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              The Echo will unlock at a random moment within this period.
            </p>
          </>
        )}

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 58px)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '48px 12px 80px',
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 580,
  background: '#fff',
  borderRadius: 28,
  boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
  padding: 'clamp(20px, 5vw, 40px) clamp(20px, 6vw, 40px) 44px',
  boxSizing: 'border-box',
};

const stepBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 36,
  flexWrap: 'wrap',
};

const stepHeadingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#1a1a2e',
  letterSpacing: '-0.02em',
  margin: '0 0 6px',
};

const stepSubStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b7280',
  margin: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14,
  color: '#1a1a2e',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1.5px solid #e5e7eb',
  borderRadius: 12,
  padding: '11px 22px',
  fontSize: 14,
  fontWeight: 500,
  color: '#6b7280',
  cursor: 'pointer',
};

const nextBtnStyle = (enabled: boolean): React.CSSProperties => ({
  background: enabled ? '#1a1a2e' : '#e5e7eb',
  color: enabled ? '#fff' : '#9ca3af',
  border: 'none',
  borderRadius: 12,
  padding: '11px 28px',
  fontSize: 14,
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
  transition: 'all 0.15s',
});
