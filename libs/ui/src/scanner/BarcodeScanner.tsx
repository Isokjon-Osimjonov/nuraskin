import * as React from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Flashlight, FlashlightOff, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (err: Error) => void;
  isActive: boolean;
}

export function BarcodeScanner({ onScan, onError, isActive }: BarcodeScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const readerRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const lastScanRef = React.useRef<{ barcode: string; time: number } | null>(null);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [isTorchOn, setIsTorchOn] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [manualInput, setManualInput] = React.useState('');

  const DEBOUNCE_MS = 1500;

  React.useEffect(() => {
    if (!isActive) {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanning = async () => {
      try {
        const videoInputDevices = await reader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          throw new Error('No video input devices found');
        }

        // Prefer back camera
        const constraints: MediaStreamConstraints = {
          video: { facingMode: 'environment' }
        };

        await reader.decodeFromConstraints(constraints, videoRef.current!, (result: Result | null, error: Error | undefined) => {
          if (result) {
            const barcode = result.getText();
            const now = Date.now();

            if (
              lastScanRef.current &&
              lastScanRef.current.barcode === barcode &&
              now - lastScanRef.current.time < DEBOUNCE_MS
            ) {
              return;
            }

            lastScanRef.current = { barcode, time: now };
            
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }

            try {
              onScan(barcode);
            } catch (scanErr) {
              console.error('BarcodeScanner onScan error:', scanErr);
              if (onError) onError(scanErr as Error);
            }
          }

          if (error && !(error.name === 'NotFoundException')) {
            // NotFoundException is normal when no barcode is in view
            console.error('BarcodeScanner decode error:', error);
          }
        });

        // Check for torch support
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

      } catch (err) {
        console.error('Scanner error:', err);
        if (onError) onError(err as Error);
      }
    };

    startScanning();

    return () => {
      reader.reset();
    };
  }, [isActive, onScan, onError]);

  const toggleTorch = async () => {
    if (!readerRef.current || !hasTorch) return;
    
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        } as any);
        setIsTorchOn(!isTorchOn);
      }
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      setManualMode(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      {!manualMode ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 border-2 border-white/20 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-scan-line" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-4">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
              >
                {isTorchOn ? <FlashlightOff size={24} /> : <Flashlight size={24} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
            >
              <Keyboard size={24} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
          <div className="w-full max-w-sm space-y-4">
            <h3 className="text-lg font-medium text-center">Manual Entry</h3>
            <p className="text-sm text-muted-foreground text-center">
              Enter the barcode or the last 6 digits of the SKU.
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoFocus
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg text-center ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="123456"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="flex-1 h-11 rounded-md border border-input bg-background hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
