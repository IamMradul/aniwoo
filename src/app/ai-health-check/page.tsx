'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, Image, Loader2, ShieldCheck, Stethoscope, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FadeInSection } from '@/components/common/FadeInSection';

type HealthStatus = 'healthy' | 'warning' | 'concern';

type AnalysisResult = {
  status: HealthStatus;
  confidence: number;
  findings: string[];
  recommendations: string[];
};

async function analyzeImageAI(image: File): Promise<AnalysisResult> {
  // TODO: Replace mock implementation with TensorFlow.js or Vision API integration
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const statuses: HealthStatus[] = ['healthy', 'warning', 'concern'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  if (status === 'healthy') {
    return {
      status,
      confidence: 92,
      findings: ['Healthy coat condition', 'Clear eyes', 'Normal posture'],
      recommendations: ['Continue regular checkups', 'Maintain current diet', 'Keep a monthly photo log for tracking']
    };
  }

  if (status === 'warning') {
    return {
      status,
      confidence: 81,
      findings: [
        'Mild redness on skin',
        'Slight dullness in coat',
        'Potential irritation around ears (low confidence)'
      ],
      recommendations: [
        'Schedule a non-urgent vet consultation',
        'Monitor behavior and appetite over the next few days',
        'Avoid new foods or treats until cleared by a vet'
      ]
    };
  }

  return {
    status,
    confidence: 76,
    findings: [
      'Noticeable skin irritation',
      'Possible swelling near joints',
      'Body posture suggests discomfort'
    ],
    recommendations: [
      'Consult a veterinarian as soon as possible',
      'Limit strenuous activity until evaluated',
      'Capture additional photos to share with your vet'
    ]
  };
}

const statusConfig: Record<
  HealthStatus,
  { label: string; colorClass: string; badgeClass: string; description: string }
> = {
  healthy: {
    label: 'Healthy',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeClass: 'bg-emerald-500/10 text-emerald-600',
    description: 'Your pet appears healthy based on this photo. Keep up the great care!'
  },
  warning: {
    label: 'Warning',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeClass: 'bg-amber-500/10 text-amber-700',
    description:
      'Our AI has detected some early signs that may require attention. We recommend monitoring and speaking with a vet.'
  },
  concern: {
    label: 'Concern',
    colorClass: 'bg-red-50 text-red-800 border-red-200',
    badgeClass: 'bg-red-500/10 text-red-700',
    description:
      'There are signs that could indicate a health issue. Please consult a licensed veterinarian as soon as possible.'
  }
};

export default function AiHealthCheck() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onFileSelected = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const selected = fileList[0];
    if (!['image/jpeg', 'image/png'].includes(selected.type) || selected.size > 10 * 1024 * 1024) {
      // In a real app we would show a toast here
      return;
    }
    setFile(selected);
    setResult(null);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      onFileSelected(event.dataTransfer.files);
    },
    [onFileSelected]
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeImageAI(file);
      setResult(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file]);

  const handleDownloadReport = useCallback(() => {
    if (!result || !file) return;

    const report = {
      petImageName: file.name,
      analyzedAt: new Date().toISOString(),
      status: result.status,
      confidence: result.confidence,
      findings: result.findings,
      recommendations: result.recommendations,
      disclaimer:
        'This AI analysis is for informational purposes only and is not a medical diagnosis. Always consult a licensed veterinarian for professional evaluation.'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aniwoo-ai-health-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [file, result]);

  const currentStatusConfig = useMemo(
    () => (result ? statusConfig[result.status] : null),
    [result]
  );

  return (
    <div className="bg-light pb-16">
      <section className="bg-gradient-to-b from-dark via-dark to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              AI Pet Health Scanner
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              AI Pet Health Scanner by Aniwoo
            </h1>
            <p className="mt-3 text-sm text-slate-100/90 sm:text-base">
              Upload a photo of your pet and let Aniwoo&apos;s AI highlight potential health concerns in seconds.
              Designed to support, not replace, your trusted veterinarian.
            </p>
          </div>
          <div className="mt-8 grid gap-6 text-sm text-slate-100 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">1. Upload</h3>
                <p className="text-xs text-slate-200">
                  Drop a clear photo of your pet in good lighting (JPG or PNG, up to 10MB).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">2. Analyze</h3>
                <p className="text-xs text-slate-200">
                  Our AI analyzes visible signs like coat, posture, and skin patterns in seconds.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">3. Get Results</h3>
                <p className="text-xs text-slate-200">
                  Review insights, download a report, and share with your veterinarian if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FadeInSection className="mt-[-40px]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-100 md:grid-cols-[1.1fr,1fr] md:p-7 lg:p-8">
            <div>
              <h2 className="text-base font-semibold text-dark sm:text-lg">Upload your pet&apos;s photo</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Accepted formats: JPG, PNG • Max size: 10MB • For best results, use natural lighting and a clear view of
                your pet&apos;s face and body.
              </p>

              <label
                htmlFor="pet-image-upload"
                className={`mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-primary/70 hover:bg-slate-50/80'
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
              >
                <input
                  id="pet-image-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(event) => onFileSelected(event.target.files)}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Image className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark">
                      Drop your pet&apos;s photo here or{' '}
                      <span className="text-primary underline underline-offset-2">click to browse</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Make sure your pet is clearly visible and centered in the frame.
                    </p>
                  </div>
                  {file && (
                    <p className="mt-1 text-xs text-slate-600">
                      Selected file:{' '}
                      <span className="font-medium text-dark">
                        {file.name} ({Math.round(file.size / 1024)} KB)
                      </span>
                    </p>
                  )}
                </div>
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Now'
                  )}
                </button>
                <p className="text-[11px] text-slate-500">
                  Analysis takes around 3 seconds. No images are stored in this demo experience.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-semibold text-dark sm:text-lg">Analysis results</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Uploaded pet preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center text-xs text-slate-500">
                      <Image className="mb-2 h-6 w-6 text-slate-400" aria-hidden="true" />
                      <span>Preview of your pet&apos;s photo will appear here after upload.</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  {result && currentStatusConfig ? (
                    <>
                      <div
                        className={`rounded-2xl border p-3 text-xs ${currentStatusConfig.colorClass}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                            Health Status
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentStatusConfig.badgeClass}`}
                          >
                            {currentStatusConfig.label}
                          </span>
                        </div>
                        <p className="mt-2">{currentStatusConfig.description}</p>
                        <p className="mt-2 text-[11px] text-slate-600">
                          Confidence:{' '}
                          <span className="font-semibold text-dark">{result.confidence}%</span>
                        </p>
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-slate-700">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Detected Concerns
                          </p>
                          <ul className="mt-1 space-y-1">
                            {result.findings.map((item) => (
                              <li key={item} className="flex gap-1.5">
                                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-secondary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Recommended Next Steps
                          </p>
                          <ul className="mt-1 space-y-1">
                            {result.recommendations.map((item) => (
                              <li key={item} className="flex gap-1.5">
                                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Run an analysis to see your pet&apos;s health summary, potential concerns, and recommended next
                      steps.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      disabled={!result}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Download Report
                    </button>
                    <Link
                      href="/vets"
                      className="inline-flex items-center justify-center rounded-full border border-dark/80 bg-dark px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black"
                    >
                      <Stethoscope className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Consult a Vet
                    </Link>
                  </div>
                </div>
              </div>

              <motion.p
                className="mt-2 text-[11px] leading-relaxed text-slate-500"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4 }}
              >
                This AI analysis is for informational purposes only. It does not constitute a medical diagnosis or
                replace a professional veterinary exam. Always consult a licensed veterinarian for any concerns about
                your pet&apos;s health.
              </motion.p>
            </div>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
