// 12 built-in themes (REQ-2: "theme kam se kam 10") — token packs.
// Applied by setting CSS custom props on :root; every component reads vars.
export const THEMES = [
  { id: 'emerald', name: 'Emerald Green', vars: {
    '--sb-900':'#062A1E','--sb-850':'#083123','--sb-800':'#0A3828','--sb-card':'#124735','--sb-card-hover':'#17553F',
    '--accent':'#0FA36C','--accent-hi':'#12B76F','--accent-lo':'#077C56','--accent-rgb':'15,163,108',
    '--brand-500':'#0FA36C','--brand-600':'#0B9368','--brand-700':'#077C56','--brand-100':'#E4F4EC','--brand-50':'#F1FAF5',
    '--grad-end':'#13B79B','--bar-top':'#19B98A','--bar-bot':'#3FC9AE','--bar-hot-top':'#0C8F60','--bar-hot-bot':'#12A172',
    '--canvas':'#F3F7F5' } },
  { id: 'teal', name: 'Deep Teal', vars: {
    '--sb-900':'#04222B','--sb-850':'#062B36','--sb-800':'#08313E','--sb-card':'#0E4654','--sb-card-hover':'#115361',
    '--accent':'#0EA5A4','--accent-hi':'#14C0BE','--accent-lo':'#0B8080','--accent-rgb':'14,165,164',
    '--brand-500':'#0EA5A4','--brand-600':'#0C918F','--brand-700':'#0A7575','--brand-100':'#DDF3F2','--brand-50':'#EFF9F8',
    '--grad-end':'#1FB6D5','--bar-top':'#12B3C9','--bar-bot':'#3FD0DE','--bar-hot-top':'#0B8CA1','--bar-hot-bot':'#12A8BF',
    '--canvas':'#F1F7F8' } },
  { id: 'ocean', name: 'Ocean Blue', vars: {
    '--sb-900':'#081C3D','--sb-850':'#0A2249','--sb-800':'#0C2752','--sb-card':'#143A6E','--sb-card-hover':'#18457F',
    '--accent':'#2563EB','--accent-hi':'#3B82F6','--accent-lo':'#1D4ED8','--accent-rgb':'37,99,235',
    '--brand-500':'#2563EB','--brand-600':'#1F56CF','--brand-700':'#1A48B0','--brand-100':'#E3ECFD','--brand-50':'#F0F5FE',
    '--grad-end':'#38BDF8','--bar-top':'#3B82F6','--bar-bot':'#7DD3FC','--bar-hot-top':'#1D4ED8','--bar-hot-bot':'#2563EB',
    '--canvas':'#F2F6FB' } },
  { id: 'royal', name: 'Royal Indigo', vars: {
    '--sb-900':'#151238','--sb-850':'#1A1642','--sb-800':'#1E1A4C','--sb-card':'#2C2668','--sb-card-hover':'#332C78',
    '--accent':'#5B4FE8','--accent-hi':'#6D63F2','--accent-lo':'#473BC8','--accent-rgb':'91,79,232',
    '--brand-500':'#5B4FE8','--brand-600':'#4F43D6','--brand-700':'#4238B4','--brand-100':'#EAE8FD','--brand-50':'#F5F4FE',
    '--grad-end':'#818CF8','--bar-top':'#6366F1','--bar-bot':'#A5B4FC','--bar-hot-top':'#4338CA','--bar-hot-bot':'#5B4FE8',
    '--canvas':'#F4F4FB' } },
  { id: 'violet', name: 'Violet Orchid', vars: {
    '--sb-900':'#26113B','--sb-850':'#2D1446','--sb-800':'#341750','--sb-card':'#49236B','--sb-card-hover':'#542A7B',
    '--accent':'#8B5CF6','--accent-hi':'#9D75F8','--accent-lo':'#7341D8','--accent-rgb':'139,92,246',
    '--brand-500':'#8B5CF6','--brand-600':'#7E4AE0','--brand-700':'#6D3CC4','--brand-100':'#F0E9FE','--brand-50':'#F8F5FF',
    '--grad-end':'#C084FC','--bar-top':'#A78BFA','--bar-bot':'#D8B4FE','--bar-hot-top':'#7C3AED','--bar-hot-bot':'#8B5CF6',
    '--canvas':'#F7F5FB' } },
  { id: 'magenta', name: 'Magenta Pink', vars: {
    '--sb-900':'#2B0A20','--sb-850':'#350D27','--sb-800':'#3E102E','--sb-card':'#5A1B44','--sb-card-hover':'#67224F',
    '--accent':'#DB2777','--accent-hi':'#EC4899','--accent-lo':'#AE1C5E','--accent-rgb':'219,39,119',
    '--brand-500':'#DB2777','--brand-600':'#C42069','--brand-700':'#A31A58','--brand-100':'#FBE4F0','--brand-50':'#FDF2F8',
    '--grad-end':'#F472B6','--bar-top':'#EC4899','--bar-bot':'#F9A8D4','--bar-hot-top':'#BE185D','--bar-hot-bot':'#DB2777',
    '--canvas':'#FBF4F8' } },
  { id: 'cherry', name: 'Cherry Red', vars: {
    '--sb-900':'#2D0B0B','--sb-850':'#380E0E','--sb-800':'#411111','--sb-card':'#5E1B1B','--sb-card-hover':'#6C2121',
    '--accent':'#DC2626','--accent-hi':'#EF4444','--accent-lo':'#B91C1C','--accent-rgb':'220,38,38',
    '--brand-500':'#DC2626','--brand-600':'#C22222','--brand-700':'#9F1C1C','--brand-100':'#FCE5E5','--brand-50':'#FDF2F2',
    '--grad-end':'#F87171','--bar-top':'#EF4444','--bar-bot':'#FCA5A5','--bar-hot-top':'#B91C1C','--bar-hot-bot':'#DC2626',
    '--canvas':'#FBF4F4' } },
  { id: 'rose', name: 'Soft Rose', vars: {
    '--sb-900':'#33141E','--sb-850':'#3D1824','--sb-800':'#461B29','--sb-card':'#612839','--sb-card-hover':'#6E3043',
    '--accent':'#E11D48','--accent-hi':'#F43F5E','--accent-lo':'#BE123C','--accent-rgb':'225,29,72',
    '--brand-500':'#E11D48','--brand-600':'#CB1A42','--brand-700':'#A81536','--brand-100':'#FCE3EA','--brand-50':'#FFF1F4',
    '--grad-end':'#FB7185','--bar-top':'#FB7185','--bar-bot':'#FDA4AF','--bar-hot-top':'#BE123C','--bar-hot-bot':'#E11D48',
    '--canvas':'#FCF4F6' } },
  { id: 'amber', name: 'Royal Amber', vars: {
    '--sb-900':'#2A1B06','--sb-850':'#332108','--sb-800':'#3B270A','--sb-card':'#57400F','--sb-card-hover':'#634A13',
    '--accent':'#B45309','--accent-hi':'#D97706','--accent-lo':'#92400E','--accent-rgb':'180,83,9',
    '--brand-500':'#B45309','--brand-600':'#A04A08','--brand-700':'#863D07','--brand-100':'#F8ECD9','--brand-50':'#FDF7EC',
    '--grad-end':'#F59E0B','--bar-top':'#F59E0B','--bar-bot':'#FCD34D','--bar-hot-top':'#92400E','--bar-hot-bot':'#B45309',
    '--canvas':'#FAF6EF' } },
  { id: 'sand', name: 'Sand Espresso', vars: {
    '--sb-900':'#1E1914','--sb-850':'#251F18','--sb-800':'#2B241C','--sb-card':'#3E352A','--sb-card-hover':'#483E31',
    '--accent':'#92400E','--accent-hi':'#B45309','--accent-lo':'#7C360C','--accent-rgb':'146,64,14',
    '--brand-500':'#92400E','--brand-600':'#82390D','--brand-700':'#6E300B','--brand-100':'#F3E7DB','--brand-50':'#FAF4EC',
    '--grad-end':'#B45309','--bar-top':'#B45309','--bar-bot':'#D97706','--bar-hot-top':'#7C2D12','--bar-hot-bot':'#92400E',
    '--canvas':'#F6F2EC' } },
  { id: 'graphite', name: 'Graphite Steel', vars: {
    '--sb-900':'#14171C','--sb-850':'#181C22','--sb-800':'#1C2028','--sb-card':'#2A303B','--sb-card-hover':'#323947',
    '--accent':'#334155','--accent-hi':'#475569','--accent-lo':'#1E293B','--accent-rgb':'51,65,85',
    '--brand-500':'#334155','--brand-600':'#2C394B','--brand-700':'#24303F','--brand-100':'#E6EAF0','--brand-50':'#F2F4F8',
    '--grad-end':'#64748B','--bar-top':'#64748B','--bar-bot':'#94A3B8','--bar-hot-top':'#1E293B','--bar-hot-bot':'#334155',
    '--canvas':'#F4F5F7' } },
  { id: 'midnight', name: 'Midnight Navy', vars: {
    '--sb-900':'#0A0F1E','--sb-850':'#0C1226','--sb-800':'#0E152C','--sb-card':'#182348','--sb-card-hover':'#1D2A56',
    '--accent':'#4F46E5','--accent-hi':'#6366F1','--accent-lo':'#4039C4','--accent-rgb':'79,70,229',
    '--brand-500':'#4F46E5','--brand-600':'#453DCC','--brand-700':'#3A34AC','--brand-100':'#E6E5FD','--brand-50':'#F2F1FE',
    '--grad-end':'#60A5FA','--bar-top':'#60A5FA','--bar-bot':'#93C5FD','--bar-hot-top':'#3730A3','--bar-hot-bot':'#4F46E5',
    '--canvas':'#F3F4FA' } }
]
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0]
export function applyTheme(id) {
  const t = themeById(id)
  for (const k in t.vars) document.documentElement.style.setProperty(k, t.vars[k])
  document.documentElement.style.setProperty('--grad-primary', `linear-gradient(135deg, var(--brand-600), var(--grad-end))`)
  document.documentElement.style.setProperty('--sb-active', 'var(--accent)')
  document.documentElement.style.setProperty('--sb-ink-2', 'rgba(255,255,255,.72)')
  return t
}
