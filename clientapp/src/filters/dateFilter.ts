type DateFormat = 'YYYY' | 'MM' | 'DD' | 'HH' | 'mm' | 'ss';
type FormatMap = Record<DateFormat, string | number>;

export function useDateFilter() {
  const dateFilter = (value: string | Date | null, format: string = 'YYYY-MM-DD'): string => {
    if (!value) return ''

    const date = value instanceof Date ? value : new Date(value)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date provided to dateFilter')
      return ''
    }

    const formatMap: FormatMap = {
      YYYY: date.getFullYear(),
      MM: String(date.getMonth() + 1).padStart(2, '0'),
      DD: String(date.getDate()).padStart(2, '0'),
      HH: String(date.getHours()).padStart(2, '0'),
      mm: String(date.getMinutes()).padStart(2, '0'),
      ss: String(date.getSeconds()).padStart(2, '0')
    }

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match: string): string => formatMap[match as DateFormat].toString())
  }

  return { dateFilter }
}