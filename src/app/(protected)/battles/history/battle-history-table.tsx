'use client'

import { useMemo } from 'react'

import { formatDistanceToNow } from 'date-fns'
import {
  Trophy,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Award
} from 'lucide-react'

import { ServerSideTable } from '@/components/blocks/table/server-side-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib'
import type { BattleWithDetails } from '@/lib/db/queries/battles'
import { type ColumnConfig } from '@/lib/table/table-columns-config'

interface BattleHistoryTableProps {
  data: BattleWithDetails[]
  pageCount: number
  totalCount: number
  userId: number
}

export function BattleHistoryTable({
  data,
  pageCount,
  totalCount,
  userId
}: BattleHistoryTableProps) {
  const columnConfigs: ColumnConfig[] = useMemo(
    () => [
      {
        id: 'result',
        header: 'Result',
        type: 'custom',
        enableSorting: false
      },
      {
        id: 'playerCP',
        header: 'Your CP',
        type: 'custom',
        enableSorting: true
      },
      {
        id: 'opponentCP',
        header: 'Opponent CP',
        type: 'custom',
        enableSorting: true
      },
      {
        id: 'cpDifference',
        header: 'CP Difference',
        type: 'custom',
        enableSorting: false
      },
      {
        id: 'rewards',
        header: 'Rewards',
        type: 'custom',
        enableSorting: false
      },
      {
        accessorKey: 'createdAt',
        header: 'Time',
        type: 'custom',
        enableSorting: true
      }
    ],
    []
  )

  const customRenderers = useMemo(
    () => ({
      result: (row: BattleWithDetails) => {
        const isWinner = row.winnerId === userId
        const Icon = isWinner ? Trophy : Shield
        const result = isWinner ? 'Victory' : 'Defeat'
        const color = isWinner ? 'text-green-600' : 'text-red-600'
        const badgeClass = isWinner
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'

        return (
          <div className='flex items-center gap-2'>
            <Icon className={cn('h-4 w-4', color)} />
            <Badge variant='secondary' className={badgeClass}>
              {result}
            </Badge>
          </div>
        )
      },
      playerCP: (row: BattleWithDetails) => {
        const playerCP =
          row.player1Id === userId ? row.player1CP : row.player2CP
        return <div className='font-medium'>{playerCP}</div>
      },
      opponentCP: (row: BattleWithDetails) => {
        const opponentCP =
          row.player1Id === userId ? row.player2CP : row.player1CP
        return <div className='font-medium'>{opponentCP}</div>
      },
      cpDifference: (row: BattleWithDetails) => {
        const playerCP =
          row.player1Id === userId ? row.player1CP : row.player2CP
        const opponentCP =
          row.player1Id === userId ? row.player2CP : row.player1CP
        const cpDiff = playerCP - opponentCP

        return (
          <div className='flex items-center gap-1'>
            {cpDiff > 0 ? (
              <TrendingUp className='h-4 w-4 text-green-500' />
            ) : cpDiff < 0 ? (
              <TrendingDown className='h-4 w-4 text-red-500' />
            ) : null}
            <span
              className={cn(
                'font-medium',
                cpDiff > 0 && 'text-green-600',
                cpDiff < 0 && 'text-red-600'
              )}
            >
              {cpDiff > 0 && '+'}
              {cpDiff}
            </span>
          </div>
        )
      },
      rewards: (row: BattleWithDetails) => {
        const isWinner = row.winnerId === userId

        return isWinner ? (
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-1'>
              <Award className='h-3 w-3 text-yellow-500' />
              <span className='text-sm'>
                {row.feeDiscountPercent || 25}% discount
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Trophy className='h-3 w-3 text-blue-500' />
              <span className='text-sm text-blue-600 dark:text-blue-400'>
                +{row.winnerXP || 50} XP
              </span>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-1'>
            <Shield className='h-3 w-3 text-gray-500' />
            <span className='text-muted-foreground text-sm'>
              +{row.loserXP || 10} XP
            </span>
          </div>
        )
      },
      createdAt: (row: BattleWithDetails) => (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <Clock className='h-3 w-3' />
          {formatDistanceToNow(new Date(row.createdAt), {
            addSuffix: true
          })}
        </div>
      )
    }),
    [userId]
  )

  return (
    <ServerSideTable
      data={data}
      columnConfigs={columnConfigs}
      customRenderers={customRenderers}
      pageCount={pageCount}
      totalCount={totalCount}
      pageSizeOptions={[10, 20, 50, 100]}
      showGlobalFilter={false}
    />
  )
}
