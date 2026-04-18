import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { timelineApi, type TimelineItemDto } from '@/services/timelineApi';
import { toast } from 'sonner';
import { Calendar, Filter, Clock, Pill, FlaskConical, Activity, Heart, Scissors, FileText } from 'lucide-react';

const TimelinePanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timelineItems, setTimelineItems] = useState<TimelineItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    if (user) fetchTimeline();
  }, [user, typeFilter, dateRange]);

  const fetchTimeline = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await timelineApi.getTimeline(typeFilter, dateRange);
      setTimelineItems(items);
    } catch (error: any) {
      console.error('Failed to fetch timeline:', error);
      toast.error(error.error || t('timeline.fetchError'));
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5 text-blue-600" />;
      case 'lab_test':
        return <FlaskConical className="w-5 h-5 text-amber-600" />;
      case 'radiology':
        return <Activity className="w-5 h-5 text-purple-600" />;
      case 'diagnosis':
        return <Heart className="w-5 h-5 text-rose-600" />;
      case 'surgery':
        return <Scissors className="w-5 h-5 text-cyan-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'medication':
        return t('timeline.types.medication');
      case 'lab_test':
        return t('timeline.types.labTest');
      case 'radiology':
        return t('timeline.types.radiology');
      case 'diagnosis':
        return t('timeline.types.diagnosis');
      case 'surgery':
        return t('timeline.types.surgery');
      default:
        return t('timeline.types.other');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('timeline.today');
    } else if (diffDays === 1) {
      return t('timeline.yesterday');
    } else if (diffDays < 7) {
      return t('timeline.daysAgo', { count: diffDays });
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t('timeline.weeksAgo', { count: weeks });
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return t('timeline.monthsAgo', { count: months });
    } else {
      const years = Math.floor(diffDays / 365);
      return t('timeline.yearsAgo', { count: years });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('timeline.title')}</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('timeline.filterByType')}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('timeline.allTypes')}</option>
            <option value="medication">{t('timeline.types.medication')}</option>
            <option value="lab_test">{t('timeline.types.labTest')}</option>
            <option value="radiology">{t('timeline.types.radiology')}</option>
            <option value="diagnosis">{t('timeline.types.diagnosis')}</option>
            <option value="surgery">{t('timeline.types.surgery')}</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('timeline.filterByDate')}
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('timeline.allDates')}</option>
            <option value="30d">{t('timeline.last30Days')}</option>
            <option value="6m">{t('timeline.last6Months')}</option>
            <option value="1y">{t('timeline.lastYear')}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Timeline Items */}
      {!loading && (
        <div className="space-y-4">
          {timelineItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('timeline.noEvents')}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline Items */}
              <div className="space-y-6">
                {timelineItems.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4">
                    {/* Timeline Dot */}
                    <div className="relative z-10 w-8 h-8 bg-white border-4 border-gray-200 rounded-full flex items-center justify-center">
                      {getIcon(item.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelinePanel;
