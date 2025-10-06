// Packages:
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import sleep from 'sleep-promise'

// Typescript:
import type { MOSDACLog, MOSDACLogData } from '@/pages/api/log'

// Assets:
import { CheckIcon, FrownIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from './ui/scroll-area'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Functions:
const HistoryCommand = ({
  scrollAreaRef,
  logs,
  selectedLog,
  onSelect,
  setIsHistoryOn,
  historicalLogsFetchingStatus,
  localTimezoneOffset,
  formatGMTToLocal12Hours,
}: {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  logs: MOSDACLogData
  selectedLog: MOSDACLog | null
  onSelect: (selectedLog: MOSDACLog, logIndex: number) => void
  setIsHistoryOn: (value: boolean) => void
  historicalLogsFetchingStatus: Map<string, number | boolean>
  localTimezoneOffset: string
  formatGMTToLocal12Hours: (time: string) => string
}) => (
  <Command>
    <CommandList>
      <CommandGroup>
        <ScrollArea ref={scrollAreaRef} className='h-52'>
          {logs.map((log, index) => (
            <CommandItem
              key={log.name}
              value={log.name}
              onSelect={logName => {
                let _selectedLog: MOSDACLog | null = null
                if (selectedLog?.name === logName) {
                  _selectedLog = logs[0]
                  setIsHistoryOn(false)
                } else {
                  _selectedLog = logs.find(log => log.name === logName) ?? null
                  setIsHistoryOn(index !== 0)
                }

                onSelect(_selectedLog!, index)
              }}
              className='justify-between cursor-pointer'
            >
              <div className={cn('text-sm font-medium transition-all', log.name === selectedLog?.name && 'text-blue-500')}>
                {log.when.date} {log.when.month} {log.when.year} <span className='font-bold'>{formatGMTToLocal12Hours(log.when.time)}</span> ({localTimezoneOffset}) {index === 0 ? ' [Latest]' : ''}
              </div>
              {
                historicalLogsFetchingStatus.has(log.name) ? (
                  <>
                    {
                      historicalLogsFetchingStatus.get(log.name) === false ? (
                        <span title='Something went wrong..'>
                          <FrownIcon className='size-3 text-rose-500' />
                        </span>
                      ) : (
                        <div className='flex items-center justify-center gap-1'>
                          <span className='text-xs font-medium'>{(((historicalLogsFetchingStatus.get(log.name) as number | undefined) ?? 0) * 100).toFixed(0)}%</span>
                          <Loader2Icon className='size-3 animate-spin' />
                        </div>
                      )
                    }
                  </>
                ) : (
                  <CheckIcon
                    className={cn(
                      'size-4',
                      log.name === selectedLog?.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                )
              }
            </CommandItem>
          ))}
        </ScrollArea>
      </CommandGroup>
    </CommandList>
  </Command>
)

const HistoryCombobox = ({
  useSmallView,
  toggleSmallViewDialog,
  logs,
  selectedLog,
  onSelect,
  historicalLogsFetchingStatus,
  isHistoryOn,
  setIsHistoryOn,
}: {
  useSmallView: boolean
  toggleSmallViewDialog: (state: boolean) => Promise<void>
  logs: MOSDACLogData
  selectedLog: MOSDACLog | null
  onSelect: (selectedLog: MOSDACLog, logIndex: number) => void
  historicalLogsFetchingStatus: Map<string, number | boolean>
  isHistoryOn: boolean
  setIsHistoryOn: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Memo:
  const localTimezoneOffset = useMemo(() => {
    const offsetMinutes = new Date().getTimezoneOffset()
    const absOffset = Math.abs(offsetMinutes)
    const sign = offsetMinutes <= 0 ? '+' : '-'
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
    const minutes = String(absOffset % 60).padStart(2, '0')
    return `${sign}${hours}:${minutes}`
  }, [])

  // State:
  const [historyPopoverOpen, setHistoryPopoverOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [animateResetIcon, setAnimateResetIcon] = useState(false)

  // Effects:
  useEffect(() => {
    if (!historyPopoverOpen || !selectedLog?.name) return

    const raf = requestAnimationFrame(() => {
      const root = scrollAreaRef.current ?? undefined
      const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
      const escape = (window as unknown as { CSS: { escape: (input: string) => void } }).CSS?.escape ?? ((s: string) => s.replace(/"/g, '\\"'))
      const selector = `[data-value="${escape(selectedLog.name)}"]`
      const target = (viewport ?? root)?.querySelector(selector) as HTMLElement | null
      if (target) {
        target.scrollIntoView({ block: 'center', inline: 'nearest' })
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [historyPopoverOpen, selectedLog?.name])

  // Functions:
  const formatGMTToLocal12Hours = (time: string) => {
    if (!time || (time.length !== 3 && time.length !== 4)) return time

    const normalized = time.padStart(4, '0')
    const hoursUTC = parseInt(normalized.slice(0, 2), 10)
    const minutesUTC = parseInt(normalized.slice(2), 10)
    if (Number.isNaN(hoursUTC) || Number.isNaN(minutesUTC)) return time

    const offsetMinutes = new Date().getTimezoneOffset()
    const totalMinutesUTC = hoursUTC * 60 + minutesUTC
    let totalMinutesLocal = totalMinutesUTC - offsetMinutes

    totalMinutesLocal = ((totalMinutesLocal % 1440) + 1440) % 1440
    const localHours24 = Math.floor(totalMinutesLocal / 60)
    const localMinutes = totalMinutesLocal % 60

    const ampm = localHours24 < 12 ? 'AM' : 'PM'
    const hours12 = ((localHours24 + 11) % 12) + 1
    const minutesStr = String(localMinutes).padStart(2, '0')
    return `${hours12}:${minutesStr} ${ampm}`
  }

  // Return:
  return (
    <>
      {
        useSmallView ? (
          <Dialog
            open={historyPopoverOpen} 
            onOpenChange={async _open => {
              if (_open) {
                await toggleSmallViewDialog(_open)
                setHistoryPopoverOpen(_open)
              } else {
                setHistoryPopoverOpen(_open)
                await toggleSmallViewDialog(_open)
              }
            }}
          >
            <div className='flex gap-2 w-full'>
              <DialogTrigger asChild>
                <Button variant='outline' className={cn('relative w-[calc(100%-44px)] cursor-pointer', historyPopoverOpen && '!bg-zinc-200')} disabled={logs.length === 0}>
                  <div
                    className={cn(
                      'absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all',
                      historicalLogsFetchingStatus.size > 0 ? 'bg-blue-500 animate-pulse' : isHistoryOn ? 'bg-green-500' : 'bg-rose-400',
                    )}
                  />
                  History
                </Button>
              </DialogTrigger>
              <Button
                size='icon'
                variant='outline'
                className='relative cursor-pointer'
                disabled={logs.length === 0}
                onClick={async () => {
                  setIsHistoryOn(false)
                  onSelect(logs[0], 0)
                  setAnimateResetIcon(true)
                  await sleep(1000)
                  setAnimateResetIcon(false)
                }}
              >
                <RotateCcwIcon className={cn('size-4 text-black', animateResetIcon && 'rotate-counterclockwise')} />
              </Button>
            </div>
            <DialogContent hideOverlay showCloseButton={false} className={cn('z-[1001] p-0', `${geistSans.className} font-sans`)}>
              <VisuallyHidden>
                <DialogTitle>Layers</DialogTitle>
                <DialogDescription>Select a layer from the list below</DialogDescription>
              </VisuallyHidden>
              <HistoryCommand
                scrollAreaRef={scrollAreaRef}
                logs={logs}
                selectedLog={selectedLog}
                onSelect={onSelect}
                setIsHistoryOn={setIsHistoryOn}
                historicalLogsFetchingStatus={historicalLogsFetchingStatus}
                localTimezoneOffset={localTimezoneOffset}
                formatGMTToLocal12Hours={formatGMTToLocal12Hours}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Popover open={historyPopoverOpen} onOpenChange={setHistoryPopoverOpen}>
            <div className='flex gap-2 w-full'>
              <PopoverTrigger asChild>
                <Button variant='outline' className='relative w-[calc(100%-44px)] cursor-pointer' disabled={logs.length === 0}>
                  <div
                    className={cn(
                      'absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all',
                      historicalLogsFetchingStatus.size > 0 ? 'bg-blue-500 animate-pulse' : isHistoryOn ? 'bg-green-500' : 'bg-rose-400',
                    )}
                  />
                  History
                </Button>
              </PopoverTrigger>
              <Button
                size='icon'
                variant='outline'
                className='relative cursor-pointer'
                disabled={logs.length === 0}
                onClick={async () => {
                  setIsHistoryOn(false)
                  onSelect(logs[0], 0)
                  setAnimateResetIcon(true)
                  await sleep(1000)
                  setAnimateResetIcon(false)
                }}
              >
                <RotateCcwIcon className={cn('size-4 text-black', animateResetIcon && 'rotate-counterclockwise')} />
              </Button>
            </div>
            <PopoverContent className={cn('z-[1001] w-96 p-0', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={60}>
              <HistoryCommand
                scrollAreaRef={scrollAreaRef}
                logs={logs}
                selectedLog={selectedLog}
                onSelect={onSelect}
                setIsHistoryOn={setIsHistoryOn}
                historicalLogsFetchingStatus={historicalLogsFetchingStatus}
                localTimezoneOffset={localTimezoneOffset}
                formatGMTToLocal12Hours={formatGMTToLocal12Hours}
              />
            </PopoverContent>
          </Popover>
        )
      }
    </>
  )
}

// Exports:
export default HistoryCombobox
