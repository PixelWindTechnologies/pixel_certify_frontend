import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiAwardLine, RiDownloadLine, RiPrinterLine, RiCloseLine, RiCheckLine } from 'react-icons/ri'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Certificate { _id: string; certificateId: string; student: string; studentName: string; studentId: string; courseName: string; batchTitle: string; startDate: string; completionDate: string; attendancePercentage: number; issuedAt: string }

function CertificateTemplate({ cert }: { cert: Certificate }) {
  return (
    <div id="cert-print" style={{ width: '794px', minHeight: '560px', background: 'white', padding: '48px', fontFamily: 'Georgia, serif', border: '8px solid #1d4ed8', position: 'relative', boxSizing: 'border-box' }}>
      {/* Corner decoration */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, bottom: 12, border: '2px solid #93c5fd', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>PW</span>
        </div>
        <h1 style={{ fontSize: '13px', letterSpacing: '4px', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '4px' }}>PixelWind Training Institute</h1>
        <div style={{ width: '80px', height: '2px', background: '#1d4ed8', margin: '8px auto' }} />
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '8px' }}>Certificate of Completion</h2>
      </div>

      {/* Body */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>This is to certify that</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8', borderBottom: '2px solid #1d4ed8', display: 'inline-block', paddingBottom: '4px', marginBottom: '12px' }}>
          {cert.studentName}
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Student ID: {cert.studentId}</p>
        <p style={{ fontSize: '14px', color: '#475569' }}>has successfully completed the internship program in</p>
        <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: '10px 0' }}>{cert.courseName}</p>
        <p style={{ fontSize: '12px', color: '#64748b' }}>Batch: {cert.batchTitle}</p>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Start Date</p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{formatDate(cert.startDate)}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Completion Date</p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{formatDate(cert.completionDate)}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Attendance</p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e' }}>{cert.attendancePercentage}%</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <div>
          <div style={{ width: '120px', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Authorized Signature</p>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>PixelWind Institute</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8' }}>Certificate ID</p>
          <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>{cert.certificateId}</p>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Issued: {formatDate(cert.issuedAt)}</p>
        </div>
      </div>
    </div>
  )
}

export default function StudentCertificatesPage() {
  const { user } = useAuth()
  const [viewCert, setViewCert] = useState<Certificate | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const { data: certs = [], isLoading } = useQuery<Certificate[]>({ queryKey: ['student-certs'], queryFn: () => api.get('/student/certificates').then(r => r.data) })
  const { data: eligibilityArray = [] } = useQuery<any[]>({ queryKey: ['student-eligibility'], queryFn: () => api.get('/student/eligibility').then(r => r.data) })

  const handleDownloadPDF = async () => {
    const content = document.getElementById('cert-print')
    if (!content || !viewCert) return

    setIsDownloading(true)
    try {
      if (typeof html2canvas !== 'function') {
        throw new Error("Library 'html2canvas' not loaded. Please refresh or check installation.");
      }

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      if (!canvas) throw new Error("Failed to capture certificate content")

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`Certificate_${viewCert.certificateId}.pdf`)
      toast({ title: 'Success', description: 'Certificate downloaded successfully' })
    } catch (err) {
      console.error('PDF Generation Error:', err)
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    const content = document.getElementById('cert-print')
    if (!content) return
    const w = window.open('', '', 'width=900,height=700')
    if (!w) return
    w.document.write(`<html><head><title>Certificate - ${viewCert?.studentName}</title></head><body style="margin:0;padding:20px;background:#f8fafc;">${content.outerHTML}</body></html>`)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="space-y-4">
      {/* Eligibility banner */}
      {eligibilityArray
        .filter((e: any) => !certs.some(c => c.student === e.enrollmentId))
        .map((eligibility: any) => (
        !eligibility.eligible ? (
          <div key={eligibility.enrollmentId} className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 p-4">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-2">Certificate not yet available</p>
            <div className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
              {!eligibility.batchCompleted && <div className="flex items-center gap-2"><RiCloseLine className="text-red-500" /> Batch not yet completed</div>}
              {!eligibility.feesCleared && <div className="flex items-center gap-2"><RiCloseLine className="text-red-500" /> Fees pending (Due: {formatCurrency(eligibility.dueAmount)})</div>}
              {!eligibility.attendanceOk && <div className="flex items-center gap-2"><RiCloseLine className="text-red-500" /> Attendance {eligibility.attendancePercentage}% (minimum 75%)</div>}
            </div>
            <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">Complete requirements to earn your certificate.</p>
          </div>
        ) : (
          <div key={eligibility.enrollmentId} className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 p-4 flex items-center gap-3">
            <RiCheckLine className="text-emerald-500 text-xl flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">You are eligible for a certificate! Contact your admin to get it issued.</p>
          </div>
        )
      ))}

      {/* Certificate Locker */}
      <div>
        <h2 className="text-base font-semibold mb-3">My Certificates ({certs.length})</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : certs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <RiAwardLine className="text-4xl text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">You have not earned any certificate till now</p>
              <p className="text-sm text-muted-foreground mt-1">Complete your internship requirements to earn your first certificate.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {certs.map(c => (
              <Card key={c._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                      <RiAwardLine className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                      <p className="font-semibold">{c.courseName}</p>
                      <p className="text-sm text-muted-foreground">{c.batchTitle}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground mb-4">
                    <div className="flex justify-between"><span>Completion:</span><span>{formatDate(c.completionDate)}</span></div>
                    <div className="flex justify-between"><span>Attendance:</span><span className="text-emerald-600 font-medium">{c.attendancePercentage}%</span></div>
                    <div className="flex justify-between"><span>Issued:</span><span>{formatDate(c.issuedAt)}</span></div>
                    <div className="flex justify-between"><span>ID:</span><span className="font-mono">{c.certificateId}</span></div>
                  </div>
                  <Badge variant="success" className="mb-3">Verified</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewCert(c)}>
                      <RiPrinterLine className="mr-1" /> View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {viewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewCert(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Certificate Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <RiDownloadLine /> {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button size="sm" variant="secondary" onClick={handlePrint} className="gap-1">
                  <RiPrinterLine /> Print
                </Button>
                <Button size="sm" variant="outline" onClick={() => setViewCert(null)}>
                  <RiCloseLine />
                </Button>
              </div>
            </div>
            <div className="overflow-auto rounded-lg shadow-2xl">
              <CertificateTemplate cert={viewCert} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
