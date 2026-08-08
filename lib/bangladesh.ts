export type BangladeshDivision = {
  id: string
  name: string
  path: string
  cx: number
  cy: number
}

export const bangladeshDivisions: BangladeshDivision[] = [
  {
    id: 'dhaka',
    name: 'DHAKA',
    path: 'M108 86 L122 102 L146 96 L158 102 L170 116 L168 140 L158 160 L138 172 L116 166 L104 148 L104 124 L104 108 Z',
    cx: 135,
    cy: 137
  },
  {
    id: 'chattogram',
    name: 'CHATTOGRAM',
    path: 'M158 102 L178 102 L190 92 L196 108 L196 128 L190 144 L182 156 L170 166 L166 172 L158 160 L166 144 L172 128 L170 116 Z',
    cx: 181,
    cy: 134
  },
  {
    id: 'rajshahi',
    name: 'RAJSHAHI',
    path: 'M28 72 L40 88 L60 96 L88 94 L104 108 L106 134 L98 156 L76 168 L52 164 L34 150 L30 128 L26 104 L26 80 Z',
    cx: 68,
    cy: 122
  },
  {
    id: 'khulna',
    name: 'KHULNA',
    path: 'M34 150 L52 164 L76 168 L98 156 L108 170 L112 190 L98 204 L74 212 L52 206 L38 190 L30 172 L30 150 Z',
    cx: 72,
    cy: 180
  },
  {
    id: 'barishal',
    name: 'BARISHAL',
    path: 'M108 170 L138 172 L158 160 L166 172 L162 192 L148 206 L128 202 L112 192 L108 174 Z',
    cx: 138,
    cy: 186
  },
  {
    id: 'sylhet',
    name: 'SYLHET',
    path: 'M152 34 L172 28 L190 38 L198 54 L196 74 L190 92 L178 102 L158 102 L146 96 L156 64 Z',
    cx: 176,
    cy: 66
  },
  {
    id: 'rangpur',
    name: 'RANGPUR',
    path: 'M26 48 L40 22 L66 14 L98 16 L112 30 L118 56 L108 82 L88 94 L60 96 L40 88 L28 72 L26 52 Z',
    cx: 70,
    cy: 55
  },
  {
    id: 'mymensingh',
    name: 'MYMENSINGH',
    path: 'M112 30 L132 26 L152 34 L156 64 L146 94 L122 102 L108 86 L118 56 Z',
    cx: 132,
    cy: 64
  }
]

export const bangladeshSilhouette =
  'M24 40 L40 22 L66 14 L98 16 L122 28 L142 22 L164 24 L184 34 L198 52 L200 70 L196 90 L190 106 L194 122 L190 142 L182 158 L170 172 L158 176 L144 184 L128 194 L110 200 L92 202 L74 198 L58 190 L42 178 L34 164 L30 146 L26 128 L24 108 L26 88 L24 66 L26 48 Z'

export const bangladeshSequence = [
  'dhaka',
  'chattogram',
  'rajshahi',
  'khulna',
  'barishal',
  'sylhet',
  'rangpur',
  'mymensingh'
]
