import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('App ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h1 className="text-lg font-semibold text-slate-900">
                ເກີດຂໍ້ຜິດພາດໃນລະບົບ
              </h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ກະລຸນາໂຫຼດໜ້າຈໍຄືນໃໝ່. ຖ້າປັນຫາຍັງຄົງຢູ່ ໃຫ້ກວດສອບການເຊື່ອມຕໍ່ ຫຼື ສິດການເຂົ້າເຖິງຂໍ້ມູນ.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 break-words max-h-32 overflow-y-auto">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>ໂຫຼດໜ້າໃໝ່</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
