export const ROLE_TYPES = ['IB', 'AM', 'ER', 'S&T', 'Quant', 'PE', 'VC', 'Other'];

export const STAGES = [
  'Watching',
  'Applied',
  'Online Assessment',
  'First Round',
  'Superday / Final Round',
  'Offer',
  'Rejected',
  'Withdrew',
];

export const ARCHIVED_STAGES = ['Rejected', 'Withdrew'];

export const BOARD_COLUMNS = [
  { key: 'Watching', label: 'Watching', stages: ['Watching'] },
  { key: 'Applied', label: 'Applied', stages: ['Applied'] },
  { key: 'Online Assessment', label: 'OA', stages: ['Online Assessment'] },
  { key: 'First Round', label: 'First Round', stages: ['First Round'] },
  {
    key: 'Superday / Final Round',
    label: 'Superday',
    stages: ['Superday / Final Round'],
  },
  { key: 'Offer', label: 'Offer', stages: ['Offer'] },
  {
    key: 'archived',
    label: 'Archived',
    stages: ARCHIVED_STAGES,
    collapsible: true,
  },
];

export const STAGE_COLORS = {
  Watching: 'muted',
  Applied: 'blue-gray',
  'Online Assessment': 'amber',
  'First Round': 'blue',
  'Superday / Final Round': 'purple',
  Offer: 'green',
  Rejected: 'red',
  Withdrew: 'muted',
};

export function stageColorClass(stage) {
  return `at-stage--${STAGE_COLORS[stage] || 'muted'}`;
}
