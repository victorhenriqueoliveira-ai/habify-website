/**
 * Paleta e eixos dos gráficos do admin, derivados dos tokens.
 *
 * Os dashboards vinham com hex cravado no JSX (`#10b981`, `#3b82f6`,
 * `#f59e0b`…), que é justamente o que o design system proíbe: a barra
 * "sucesso" de um gráfico era um verde diferente do `--success` usado na
 * pílula de status logo acima, na mesma tela.
 *
 * O recharts recebe cor como atributo SVG, e `var(--token)` não resolve de
 * forma confiável nesse contexto — por isso lemos o valor computado da
 * raiz uma vez e montamos a string `hsl(...)`. Em SSR/prerender não há
 * `document`, então existe um fallback com o mesmo valor do index.css.
 */

const FALLBACK: Record<string, string> = {
  '--primary': '21 99% 50%',
  '--success': '142 71% 45%',
  '--info': '221 83% 53%',
  '--warning': '38 92% 50%',
  '--destructive': '0 84.2% 60.2%',
  '--muted-foreground': '215.4 16.3% 46.9%',
  '--border': '214.3 31.8% 91.4%',
  '--card': '0 0% 100%',
  '--foreground': '222.2 84% 4.9%',
};

function token(name: string, alpha = 1): string {
  let value = FALLBACK[name];

  if (typeof document !== 'undefined') {
    const computed = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (computed) value = computed;
  }

  return alpha === 1 ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
}

/** Cores de série, na ordem em que entram num gráfico categórico. */
export function chartPalette(): string[] {
  return [
    token('--success'),
    token('--info'),
    token('--warning'),
    token('--destructive'),
    token('--primary'),
    token('--muted-foreground'),
  ];
}

export function chartColors() {
  return {
    primary: token('--primary'),
    success: token('--success'),
    info: token('--info'),
    warning: token('--warning'),
    destructive: token('--destructive'),
    grid: token('--border'),
    axis: token('--muted-foreground'),
    surface: token('--card'),
    text: token('--foreground'),
    areaFrom: token('--success', 0.28),
    areaTo: token('--success', 0),
  };
}

/** Props comuns de `<XAxis>`/`<YAxis>` — eixo fino, rótulo em mono. */
export function axisProps(colors = chartColors()) {
  return {
    stroke: colors.axis,
    tick: { fill: colors.axis, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: colors.grid },
  } as const;
}

/** Props do `<Tooltip>` — mesma borda e sombra dos cards do admin. */
export function tooltipProps(colors = chartColors()) {
  return {
    contentStyle: {
      background: colors.surface,
      border: `1px solid ${colors.grid}`,
      borderRadius: 8,
      fontSize: 12.5,
      boxShadow: '0 4px 16px -2px rgb(0 0 0 / 0.12)',
      color: colors.text,
    },
    labelStyle: { color: colors.axis, fontSize: 11 },
  } as const;
}
