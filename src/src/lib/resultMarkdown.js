const countTableDelimiters = (line) => (line.match(/(?<!\\)\|/g) || []).length

const getTableCells = (line) => {
  let normalized = line
    .replace(/\\\|/g, '|')
    .replace(/\s*\\\s*(?=\|)/g, ' ')
    .replace(/\s*\\\s*$/g, '')
    .trim()

  if (!normalized.startsWith('|')) return null

  const delimiterCount = countTableDelimiters(normalized)
  if (delimiterCount < 2) return null

  if (!normalized.endsWith('|')) normalized = `${normalized} |`

  const cells = normalized
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)

  return cells.length >= 2 ? cells : null
}

const splitPipeSegments = (line) => {
  const normalized = String(line || '')
    .replace(/\\\|/g, '|')
    .trim()

  if (!normalized) return []

  const stripped = normalized
    .replace(/^\|/, '')
    .replace(/\|$/, '')

  return stripped
    .split('|')
    .map((cell) => cell.trim())
}

const isMarkdownTableSeparator = (line) => {
  const cells = getTableCells(line?.trim?.() || '')
  return Array.isArray(cells) && cells.length >= 2 && cells.every((cell) => /^:?-+:?$/.test(cell))
}

const buildNormalizedTableBlock = (lines, startIndex) => {
  const headerCells = getTableCells(lines[startIndex]?.trim() || '')
  const separatorCells = getTableCells(lines[startIndex + 1]?.trim() || '')
  if (!headerCells || !separatorCells) return null
  if (!separatorCells.every((cell) => /^:?-+:?$/.test(cell))) return null

  const expectedCols = headerCells.length
  const normalizedRows = [
    `| ${headerCells.join(' | ')} |`,
    `| ${Array(expectedCols).fill('---').join(' | ')} |`,
  ]

  let i = startIndex + 2
  while (i < lines.length) {
    const rawLine = String(lines[i] || '').replace(/\r/g, '')
    const trimmed = rawLine.trim()

    if (!trimmed) {
      let lookahead = i + 1
      while (lookahead < lines.length && !String(lines[lookahead] || '').trim()) {
        lookahead += 1
      }
      const nextNonEmpty = String(lines[lookahead] || '').trim()
      if (nextNonEmpty.startsWith('|')) {
        i = lookahead
        continue
      }
      break
    }

    if (!trimmed.startsWith('|')) break
    if (isMarkdownTableSeparator(trimmed)) {
      i += 1
      continue
    }

    let cells = splitPipeSegments(trimmed)
    if (cells.length === 0) {
      i += 1
      continue
    }

    i += 1

    while (i < lines.length) {
      const continuationRaw = String(lines[i] || '').replace(/\r/g, '')
      const continuation = continuationRaw.trim()

      if (!continuation) {
        let lookahead = i + 1
        while (lookahead < lines.length && !String(lines[lookahead] || '').trim()) {
          lookahead += 1
        }
        const nextNonEmpty = String(lines[lookahead] || '').trim()
        if (nextNonEmpty.startsWith('|')) {
          i = lookahead
          break
        }
        break
      }

      if (continuation.startsWith('|')) break

      if (continuation.includes('|') && cells.length < expectedCols) {
        const segments = splitPipeSegments(continuation)
        if (segments.length > 0) {
          cells[cells.length - 1] = `${cells[cells.length - 1] || ''} ${segments[0]}`.trim()
          cells.push(...segments.slice(1))
          i += 1
          continue
        }
      }

      cells[cells.length - 1] = `${cells[cells.length - 1] || ''} ${continuation}`.trim()
      i += 1
    }

    while (cells.length < expectedCols) cells.push('')
    normalizedRows.push(`| ${cells.slice(0, expectedCols).join(' | ')} |`)
  }

  return { nextIndex: i, rows: normalizedRows }
}

const normalizeGeneratedMarkdown = (text) => {
  const lines = text.split('\n')
  const normalizedLines = []
  let i = 0

  while (i < lines.length) {
    const rawLine = String(lines[i] || '')
    const line = rawLine
      .replace(/\r/g, '')
      .trimEnd()
      .replace(/\s*\\+\s*$/g, '')

    if (line.startsWith('|') && i + 1 < lines.length && isMarkdownTableSeparator(lines[i + 1])) {
      const tableBlock = buildNormalizedTableBlock(lines, i)
      if (tableBlock) {
        normalizedLines.push(...tableBlock.rows)
        i = tableBlock.nextIndex
        continue
      }
    }

    if (line !== '\\') normalizedLines.push(line)
    i += 1
  }

  return normalizedLines
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const stripHtmlTags = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<i[^>]*>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const convertHtmlTablesToMarkdown = (text) => {
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  return text.replace(tableRegex, (tableMatch, tableContent) => {
    const headerCells = []
    const bodyRows = []
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let trMatch

    while ((trMatch = trRegex.exec(tableContent)) !== null) {
      const cells = []
      const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi
      let cellMatch
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        cells.push(stripHtmlTags(cellMatch[2]).trim() || '')
      }
      if (cells.length > 0) {
        if (headerCells.length === 0) headerCells.push(...cells)
        else bodyRows.push(cells)
      }
    }

    if (headerCells.length === 0) return ''
    const headerRow = `| ${headerCells.join(' | ')} |`
    const separator = `| ${Array(headerCells.length).fill('---').join(' | ')} |`
    const rows = bodyRows.map((row) => `| ${row.join(' | ')} |`)
    return `\n${headerRow}\n${separator}\n${rows.join('\n')}\n`
  })
}

const replaceFormMarkup = (text) => text
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/<input[^>]*type=['"]checkbox['"][^>]*checked[^>]*\/?>/gi, '☑ ')
  .replace(/<input[^>]*type=['"]checkbox['"][^>]*\/?>/gi, '□ ')
  .replace(/<input[^>]*type=['"]radio['"][^>]*checked[^>]*\/?>/gi, '◉ ')
  .replace(/<input[^>]*type=['"]radio['"][^>]*\/?>/gi, '○ ')
  .replace(/<input[^>]*\/?>/gi, '')

export const sanitizeGeneratedResult = (text) => {
  if (!text) return ''

  let cleaned = String(text).replace(/\r\n/g, '\n').trimStart()
  cleaned = replaceFormMarkup(cleaned)
  cleaned = cleaned.replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ')
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')
  cleaned = cleaned.replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<\/div>/gi, '\n').replace(/<div[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
  cleaned = cleaned.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
  cleaned = cleaned.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  cleaned = convertHtmlTablesToMarkdown(cleaned)
  cleaned = cleaned.replace(/<[^>]+>/g, '')
  return normalizeGeneratedMarkdown(cleaned)
}

const escapeHtml = (text) => String(text || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatInlineMarkdown = (text) => {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return html
}

export const markdownToHtml = (markdown) => {
  if (!markdown) return ''
  const lines = sanitizeGeneratedResult(markdown).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let tableRows = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(`<p>${paragraph.map((line) => formatInlineMarkdown(line)).join('\n')}</p>`)
    paragraph = []
  }

  const flushTable = () => {
    if (tableRows.length < 2) {
      flushParagraph()
      tableRows = []
      return
    }
    let html = '<table>'
    tableRows.forEach((row, index) => {
      const cells = (getTableCells(row) || []).map((cell) => formatInlineMarkdown(cell))
      const tag = index === 0 ? 'th' : 'td'
      html += `<tr>${cells.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`
    })
    html += '</table>'
    blocks.push(html)
    tableRows = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushTable()
      return
    }
    if (getTableCells(line)) {
      flushParagraph()
      tableRows.push(line)
      return
    }
    if (tableRows.length) flushTable()
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      blocks.push(`<h${heading[1].length}>${formatInlineMarkdown(heading[2])}</h${heading[1].length}>`)
      return
    }
    const orderedItem = line.match(/^\d+\.\s+(.+)$/)
    if (orderedItem) {
      flushParagraph()
      blocks.push(`<ol><li>${formatInlineMarkdown(orderedItem[1])}</li></ol>`)
      return
    }
    paragraph.push(line)
  })

  flushParagraph()
  flushTable()
  return blocks.join('')
}

export const splitResultBlocks = (markdown) => {
  if (!markdown) return []
  return sanitizeGeneratedResult(markdown)
    .split(/\n{2,}/)
    .map((block, index) => ({ id: `block-${index}`, content: block.trim() }))
    .filter((block) => block.content)
}
