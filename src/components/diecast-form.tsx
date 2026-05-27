'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { VehicleType, Condition, DiecastItem } from '@prisma/client';
import { Camera, ImageUp, X } from 'lucide-react';
import { buildDisplayName } from '@/lib/normalize';
import type { MatchCandidate } from '@/lib/match';
import { brandOptions, colorOptions, vehicleTypes } from '@/lib/constants';
import { inferDiecastFields } from '@/lib/diecast-inference';

type FormValues = {
  id?: string;
  displayName: string;
  brand: string;
  make: string;
  model: string;
  year: string;
  scale: string;
  series: string;
  vehicleType: VehicleType | 'AUTO';
  color: string;
  variant: string;
  productCode: string;
  barcode: string;
  condition: Condition;
  quantityOwned: string;
  isWishlist: boolean;
  acquiredDate: string;
  acquiredFrom: string;
  storageLocation: string;
  notes: string;
  tagNames: string;
};

type Props = {
  mode: 'create' | 'edit';
  initialItem?: Partial<DiecastItem> & { tagNames?: string[] };
  onSavedHref?: string;
};

type ScanSummary = {
  isDiecast: boolean;
  confidence: number;
  summary: string;
  signals: string[];
  suggestions: Partial<Pick<FormValues, 'displayName' | 'brand' | 'make' | 'model' | 'year' | 'vehicleType' | 'scale' | 'series' | 'color' | 'variant' | 'productCode' | 'barcode'>>;
  matches: MatchCandidate[];
};

function toDateInput(value?: string | Date | null) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function colorHex(value: string) {
  const preset = colorOptions.find((option) => option.value.toLowerCase() === value.toLowerCase());
  if (preset) return preset.hex;
  return /^#([0-9a-f]{3}){1,2}$/i.test(value) ? value : '#3b82f6';
}

function vehicleTypeLabel(value: VehicleType) {
  return vehicleTypes.find((type) => type.value === value)?.label ?? value;
}

export function DiecastForm({ mode, initialItem, onSavedHref = '/collection' }: Props) {
  const router = useRouter();
  const cameraCloseTimerRef = useRef<number | null>(null);
  const scanJobRef = useRef(0);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [form, setForm] = useState<FormValues>({
    id: initialItem?.id,
    displayName: initialItem?.displayName ?? '',
    brand: initialItem?.brand ?? '',
    make: initialItem?.make ?? '',
    model: initialItem?.model ?? '',
    year: initialItem?.year ? String(initialItem.year) : '',
    scale: initialItem?.scale ?? '',
    series: initialItem?.series ?? '',
    vehicleType: (initialItem?.vehicleType as VehicleType) ?? (mode === 'create' ? 'AUTO' : 'OTHER'),
    color: initialItem?.color ?? '',
    variant: initialItem?.variant ?? '',
    productCode: initialItem?.productCode ?? '',
    barcode: initialItem?.barcode ?? '',
    condition: (initialItem?.condition as Condition) ?? 'NEAR_MINT',
    quantityOwned: initialItem?.quantityOwned ? String(initialItem.quantityOwned) : '1',
    isWishlist: Boolean(initialItem?.isWishlist),
    acquiredDate: toDateInput(initialItem?.acquiredDate ?? null),
    acquiredFrom: initialItem?.acquiredFrom ?? '',
    storageLocation: initialItem?.storageLocation ?? '',
    notes: initialItem?.notes ?? '',
    tagNames: initialItem?.tagNames?.join(', ') ?? '',
  });

  const previewImages = useMemo(() => selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [selectedFiles]);
  const inferred = useMemo<ReturnType<typeof inferDiecastFields>>(() => (mode === 'create' ? inferDiecastFields(form.displayName) : {}), [form.displayName, mode]);
  const resolvedBrand = form.brand.trim() || inferred.brand || '';
  const resolvedMake = form.make.trim() || inferred.make || '';
  const resolvedModel = form.model.trim() || inferred.model || '';
  const resolvedYear = form.year || inferred.year || '';
  const resolvedVehicleType = form.vehicleType === 'AUTO' ? inferred.vehicleType ?? 'OTHER' : form.vehicleType;
  const finalDisplayName = form.displayName.trim() || buildDisplayName({
    year: resolvedYear ? Number(resolvedYear) : null,
    brand: resolvedBrand,
    make: resolvedMake,
    model: resolvedModel,
    variant: form.variant,
  });
  const vehicleTypeText = vehicleTypeLabel(resolvedVehicleType);

  useEffect(() => () => previewImages.forEach((preview) => URL.revokeObjectURL(preview.url)), [previewImages]);

  useEffect(() => {
    return () => {
      if (cameraCloseTimerRef.current) window.clearTimeout(cameraCloseTimerRef.current);
    };
  }, []);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyScanSuggestions(suggestions: ScanSummary['suggestions']) {
    setForm((prev) => ({
      ...prev,
      displayName: prev.displayName.trim() || suggestions.displayName || prev.displayName,
      brand: prev.brand.trim() || suggestions.brand || prev.brand,
      make: prev.make.trim() || suggestions.make || prev.make,
      model: prev.model.trim() || suggestions.model || prev.model,
      year: prev.year.trim() || suggestions.year || prev.year,
      vehicleType:
        prev.vehicleType === 'AUTO' || prev.vehicleType === 'OTHER'
          ? suggestions.vehicleType && suggestions.vehicleType !== 'OTHER'
            ? suggestions.vehicleType
            : prev.vehicleType
          : prev.vehicleType,
      scale: prev.scale.trim() || suggestions.scale || prev.scale,
      series: prev.series.trim() || suggestions.series || prev.series,
      color: prev.color.trim() || suggestions.color || prev.color,
      variant: prev.variant.trim() || suggestions.variant || prev.variant,
      productCode: prev.productCode.trim() || suggestions.productCode || prev.productCode,
      barcode: prev.barcode.trim() || suggestions.barcode || prev.barcode,
    }));
  }

  function openCameraPanel() {
    if (cameraCloseTimerRef.current) window.clearTimeout(cameraCloseTimerRef.current);
    setCameraOpen(true);
    window.requestAnimationFrame(() => setCameraVisible(true));
  }

  function closeCameraPanel() {
    setCameraVisible(false);
    cameraCloseTimerRef.current = window.setTimeout(() => setCameraOpen(false), 220);
  }

  async function uploadSelectedFiles() {
    const uploaded: string[] = [];
    for (const file of selectedFiles) {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/uploads', { method: 'POST', body });
      if (!response.ok) throw new Error('Image upload failed');
      const data = await response.json();
      uploaded.push(data.filePath as string);
    }
    return uploaded;
  }

  async function analyzeCapturedPhoto(file: File) {
    const jobId = ++scanJobRef.current;
    setScanning(true);
    setScanProgress(0);
    setScanError(null);
    setScanSummary(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/scan/ai', {
        method: 'POST',
        body,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? 'AI scan failed');
      }

      if (jobId !== scanJobRef.current) return false;

      if (!data?.isDiecast || typeof data?.confidence !== 'number' || data.confidence < 0.65) {
        setScanError(data?.summary || 'This does not look like a diecast. Try again with the box, card, or car clearly visible.');
        setScanSummary(null);
        return false;
      }

      const suggestions: ScanSummary['suggestions'] = {
        displayName: data.suggestions?.displayName || '',
        brand: data.suggestions?.brand || '',
        make: data.suggestions?.make || '',
        model: data.suggestions?.model || '',
        year: data.suggestions?.year || '',
        vehicleType: data.suggestions?.vehicleType || 'OTHER',
        scale: data.suggestions?.scale || '',
        series: data.suggestions?.series || '',
        color: data.suggestions?.color || '',
        variant: data.suggestions?.variant || '',
        productCode: data.suggestions?.productCode || '',
        barcode: data.suggestions?.barcode || '',
      };

      applyScanSuggestions(suggestions);
      setScanSummary({
        isDiecast: data.isDiecast,
        confidence: data.confidence,
        summary: data.summary || '',
        signals: Array.isArray(data.signals) ? data.signals : [],
        suggestions,
        matches: Array.isArray(data.matches) ? data.matches : [],
      });
      return true;
    } catch (scanFailure) {
      if (jobId !== scanJobRef.current) return false;
      setScanError(scanFailure instanceof Error ? scanFailure.message : 'Scan failed');
      return false;
    } finally {
      if (jobId === scanJobRef.current) setScanning(false);
      setScanProgress(0);
    }
  }

  async function checkMatches() {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: form.id,
            displayName: finalDisplayName,
            brand: resolvedBrand,
            make: resolvedMake,
            model: resolvedModel,
            year: resolvedYear ? Number(resolvedYear) : null,
            scale: form.scale,
            series: form.series,
            vehicleType: resolvedVehicleType,
            color: form.color,
            variant: form.variant,
            productCode: form.productCode,
            barcode: form.barcode,
          }),
      });
      if (!response.ok) throw new Error('Could not check duplicates');
      const data = await response.json();
      return data.matches ?? [];
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const matches = await checkMatches();
      const topMatch = matches?.[0];
      if (topMatch && topMatch.score >= 75) {
        const proceed = window.confirm(`Possible duplicate found: ${topMatch.displayName}. Save anyway?`);
        if (!proceed) {
          setSaving(false);
          return;
        }
      }

      const imagePaths = selectedFiles.length ? await uploadSelectedFiles() : [];
      const response = await fetch(mode === 'create' ? '/api/items' : `/api/items/${form.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: finalDisplayName,
          brand: resolvedBrand,
          make: resolvedMake,
          model: resolvedModel,
          year: resolvedYear ? Number(resolvedYear) : null,
          scale: form.scale,
          series: form.series,
          vehicleType: resolvedVehicleType,
          color: form.color,
          variant: form.variant,
          productCode: form.productCode,
          barcode: form.barcode,
          condition: form.condition,
          quantityOwned: Number(form.quantityOwned || 1),
          isWishlist: form.isWishlist,
          acquiredDate: form.acquiredDate || null,
          acquiredFrom: form.acquiredFrom,
          storageLocation: form.storageLocation,
          notes: form.notes,
          tagNames: form.tagNames.split(',').map((tag) => tag.trim()).filter(Boolean),
          imagePaths,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Save failed');
      }
      const data = await response.json();
      router.push(onSavedHref === '/collection' ? `/collection/${data.item.id}` : onSavedHref.replace('[id]', data.item.id));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Quick add</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{mode === 'create' ? 'Add a diecast' : 'Edit diecast'}</h2>
          </div>
          <button
            type="button"
            onClick={openCameraPanel}
            className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-lg shadow-black/20 transition hover:bg-white/10 active:scale-[0.98]"
            aria-label="Open camera panel"
            title="Open camera panel"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Display name</span>
            <input className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-600" value={form.displayName} onChange={(e) => setField('displayName', e.target.value)} placeholder="Aventador 2003" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Brand</span>
            <select className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={resolvedBrand} onChange={(e) => setField('brand', e.target.value)}>
              <option value="">Select brand</option>
              {brandOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Make</span>
            <input className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600" value={resolvedMake} onChange={(e) => setField('make', e.target.value)} placeholder="Lamborghini" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Model</span>
            <input className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600" value={resolvedModel} onChange={(e) => setField('model', e.target.value)} placeholder="Aventador" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Year</span>
            <input type="number" className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600" value={resolvedYear} onChange={(e) => setField('year', e.target.value)} placeholder="2003" />
          </label>

          <div className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Vehicle type</span>
            <select className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={form.vehicleType} onChange={(e) => setField('vehicleType', e.target.value as FormValues['vehicleType'])}>
              <option value="AUTO">Auto / suggested ({vehicleTypeText})</option>
              {vehicleTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Color</span>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
              <span>{form.color || 'Pick a color'}</span>
              <input type="color" value={colorHex(form.color)} onChange={(e) => setField('color', e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0" aria-label="Color picker" />
            </label>
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Acquired date</span>
            <input type="date" className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={form.acquiredDate} onChange={(e) => setField('acquiredDate', e.target.value)} />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Acquired from</span>
            <input className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600" value={form.acquiredFrom} onChange={(e) => setField('acquiredFrom', e.target.value)} placeholder="Store, seller, event" />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Notes</span>
            <textarea rows={4} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-600" value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Special details, condition, packaging notes" />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Photos</span>
            <input type="file" multiple accept="image/*" capture="environment" className="rounded-2xl border border-dashed border-white/15 bg-zinc-950 px-4 py-3 text-white" onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))} />
          </label>

          <label className="flex items-center gap-3 md:col-span-2 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white">
            <input type="checkbox" checked={form.isWishlist} onChange={(e) => setField('isWishlist', e.target.checked)} />
            Mark as wishlist item
          </label>
        </div>

        {previewImages.length ? (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {previewImages.map((preview) => (
            <Image key={preview.url} src={preview.url} alt="preview" width={400} height={280} unoptimized className="h-28 w-full rounded-2xl object-cover" />
          ))}
        </div>
      ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={checkMatches} disabled={checking || saving} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 disabled:opacity-50">
            {checking ? 'Checking…' : 'Check duplicates'}
          </button>
          <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50">
            {saving ? 'Saving…' : mode === 'create' ? 'Save item' : 'Update item'}
          </button>
        </div>

        {error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      </form>

      {cameraOpen ? (
        <div className="fixed inset-0 z-[100] bg-black/60" onClick={closeCameraPanel}>
          <div
            className={`absolute inset-x-0 bottom-0 mx-auto w-[min(42rem,calc(100vw-0.75rem))] rounded-t-[2rem] border border-white/10 bg-zinc-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-transform duration-300 ease-out ${cameraVisible ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Camera</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Quick capture</h3>
              </div>
              <button type="button" onClick={closeCameraPanel} className="rounded-2xl border border-white/10 p-2 text-white" aria-label="Close camera panel">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraFileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:opacity-95"
              >
                <ImageUp className="h-4 w-4" />
                Take & scan photo
              </button>
            </div>

            <input
              ref={cameraFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) void (async () => {
                  const accepted = await analyzeCapturedPhoto(file);
                  if (accepted) setSelectedFiles((current) => [...current, file]);
                })();
                e.currentTarget.value = '';
              }}
            />

            {scanning ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Scanning photo... {scanProgress ? `${scanProgress}%` : 'Starting'}
              </div>
            ) : null}

            {scanError ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{scanError}</p> : null}

            {scanSummary ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">AI scan complete</p>
                  <p className="mt-1 text-sm text-zinc-300">Confidence {Math.round(scanSummary.confidence * 100)}%. Review the fields, then save.</p>
                  {scanSummary.summary ? <p className="mt-2 text-sm text-zinc-400">{scanSummary.summary}</p> : null}
                </div>
                <div className="grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Display name</span><span className="mt-1 block text-white">{scanSummary.suggestions.displayName || '—'}</span></div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Barcode</span><span className="mt-1 block text-white">{scanSummary.suggestions.barcode || 'Not found'}</span></div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Brand</span><span className="mt-1 block text-white">{scanSummary.suggestions.brand || '—'}</span></div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Make / Model</span><span className="mt-1 block text-white">{[scanSummary.suggestions.make, scanSummary.suggestions.model].filter(Boolean).join(' ') || '—'}</span></div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Scale</span><span className="mt-1 block text-white">{scanSummary.suggestions.scale || '—'}</span></div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 sm:col-span-2"><span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Vehicle type</span><span className="mt-1 block text-white">{scanSummary.suggestions.vehicleType || '—'}</span></div>
                </div>
                {scanSummary.signals.length ? (
                  <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Signals</p>
                    <p className="mt-1 text-white">{scanSummary.signals.slice(0, 6).join(' • ')}</p>
                  </div>
                ) : null}
                {scanSummary.matches.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Possible duplicates</p>
                    <div className="mt-2 space-y-2">
                      {scanSummary.matches.slice(0, 3).map((match) => (
                        <div key={match.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{match.displayName}</span>
                            <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-200">score {match.score}</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{match.reason.join(' • ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {previewImages.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                {previewImages.map((preview) => (
                  <Image key={preview.url} src={preview.url} alt="preview" width={400} height={280} unoptimized className="h-24 w-full rounded-2xl object-cover" />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
