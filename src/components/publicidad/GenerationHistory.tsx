import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw, History, Loader2, Search, Wand2, MessageSquare,
  Pencil, ChevronLeft, ChevronRight, ImageOff,
} from 'lucide-react';
import { useGenerationHistory } from '@/hooks/useGenerationHistory';

interface GenerationHistoryProps {
  onReuse: (record: any) => void;
}

const ITEMS_PER_PAGE = 10;

const GenerationHistory = ({ onReuse }: GenerationHistoryProps) => {
  const [modeFilter, setModeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { generations: records, loading } = useGenerationHistory({
    mode: modeFilter === 'all' ? undefined : modeFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Client-side search filter
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) => r.prompt && r.prompt.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // Reset to page 1 when filters change
  const safeCurrentPage = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
    return currentPage > totalPages ? 1 : currentPage;
  }, [filteredRecords.length, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = filteredRecords.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const modeBadge = (mode: string) => {
    switch (mode) {
      case 'template':
        return {
          label: 'Template',
          icon: <Wand2 className="w-3 h-3" />,
          className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40',
        };
      case 'free':
        return {
          label: 'Libre',
          icon: <MessageSquare className="w-3 h-3" />,
          className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
        };
      case 'edit':
        return {
          label: 'Edicion',
          icon: <Pencil className="w-3 h-3" />,
          className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/40',
        };
      default:
        return { label: mode, icon: null, className: '' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-500 text-sm">Cargando historial...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <Label className="text-xs text-gray-500 dark:text-gray-500">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por prompt..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500 dark:text-gray-500">Modo</Label>
            <Select
              value={modeFilter}
              onValueChange={(v) => {
                setModeFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="free">Libre</SelectItem>
                <SelectItem value="edit">Edicion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date from */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500 dark:text-gray-500">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-36"
            />
          </div>

          {/* Date to */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500 dark:text-gray-500">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-36"
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      {filteredRecords.length === 0 ? (
        <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6">
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f0f11] rounded-full flex items-center justify-center mx-auto">
              {searchQuery ? (
                <Search className="w-9 h-9 text-gray-300" />
              ) : (
                <ImageOff className="w-9 h-9 text-gray-300" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {searchQuery
                  ? 'Sin resultados'
                  : 'No hay generaciones registradas'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {searchQuery
                  ? `No se encontraron generaciones con "${searchQuery}".`
                  : 'Las imagenes que generes apareceran aqui.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-[#1a1a1f] px-6 py-3">
                <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="w-[180px] flex-shrink-0">Fecha</div>
                  <div className="w-[110px] flex-shrink-0">Modo</div>
                  <div className="flex-1 min-w-0">Prompt</div>
                  <div className="w-[80px] flex-shrink-0 text-center">Resolucion</div>
                  <div className="w-[100px] flex-shrink-0 text-right">Acciones</div>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {paginatedRecords.map((record) => {
                  const badge = modeBadge(record.mode);
                  return (
                    <div
                      key={record.id}
                      className="px-6 py-3.5 hover:bg-orange-50/40 dark:hover:bg-white/5 transition-colors duration-150 group"
                    >
                      <div className="flex items-center">
                        <div className="w-[180px] flex-shrink-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(record.created_at)}
                          </p>
                        </div>
                        <div className="w-[110px] flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={`${badge.className} gap-1 text-xs font-medium`}
                          >
                            {badge.icon}
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {record.prompt || '-'}
                          </p>
                        </div>
                        <div className="w-[80px] flex-shrink-0 text-center">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {record.resolution || '1K'}
                          </Badge>
                        </div>
                        <div className="w-[100px] flex-shrink-0 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReuse(record)}
                            className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Re-usar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paginatedRecords.map((record) => {
              const badge = modeBadge(record.mode);
              return (
                <Card
                  key={record.id}
                  className="bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl p-4 space-y-3 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`${badge.className} gap-1 text-xs font-medium`}
                    >
                      {badge.icon}
                      {badge.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {record.resolution || '1K'}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {record.prompt || '-'}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-400">
                      {formatDate(record.created_at)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReuse(record)}
                      className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 h-8 px-2.5 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Re-usar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">
                {filteredRecords.length} resultado{filteredRecords.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums min-w-[80px] text-center">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenerationHistory;
