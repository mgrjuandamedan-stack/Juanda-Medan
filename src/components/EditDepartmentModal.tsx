import React, { useState, useEffect } from 'react';
import { X, Building, DollarSign, User } from 'lucide-react';
import { Department, ComputedDepartment } from '../types';
import { formatRupiah, formatPercent } from '../utils/formatters';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dept: ComputedDepartment | null;
  onSave: (updatedDept: Department) => void;
}

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  dept,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [psName, setPsName] = useState('');
  const [target, setTarget] = useState(0);
  const [actual, setActual] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(0);
  const [dailyActual, setDailyActual] = useState(0);
  const [category, setCategory] = useState<'Furniture' | 'Accessories' | 'Commercial' | 'Special'>('Furniture');

  useEffect(() => {
    if (dept) {
      setName(dept.name);
      setPsName(dept.psName);
      setTarget(dept.target);
      setActual(dept.actual);
      setDailyTarget(dept.dailyTarget || 0);
      setDailyActual(dept.dailyActual || 0);
      setCategory(dept.category);
    }
  }, [dept, isOpen]);

  if (!isOpen || !dept) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...dept,
      name,
      psName,
      target: Math.round(Number(target) || 0),
      actual: Math.round(Number(actual) || 0),
      dailyTarget: Math.round(Number(dailyTarget) || 0),
      dailyActual: Math.round(Number(dailyActual) || 0),
      category,
    });
    onClose();
  };

  const mtdPercent = target > 0 ? (actual / target) * 100 : 0;
  const shortfall = Math.max(0, target - actual);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#151515] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/5 text-[#FFD700] border border-white/10">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Edit Departemen: {dept.name}
              </h3>
              <p className="text-[11px] text-white/40">
                Informa Juanda Medan - Update Target & Penjualan MTD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Nama Departemen
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FFD700]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Nama PS (Person In Charge) *
              </label>
              <input
                type="text"
                required
                value={psName}
                onChange={(e) => setPsName(e.target.value)}
                placeholder="Nama Penanggung Jawab"
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]"
              >
                <option value="Furniture">Furniture</option>
                <option value="Accessories">Accessories</option>
                <option value="Commercial">Commercial / Office</option>
                <option value="Special">Special / Seasonal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Target MTD (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Actual Sales MTD (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={actual}
                onChange={(e) => setActual(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Kekurangan Dept</span>
              <span className="font-bold font-mono text-red-400">
                {shortfall === 0 ? 'FullFill (100%+)' : formatRupiah(shortfall)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Pencapaian MTD</span>
              <span className="font-bold font-mono text-[#FFD700] text-sm">
                {formatPercent(mtdPercent)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs border border-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#FFD700] hover:bg-[#ffe234] text-black font-bold text-xs shadow transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
