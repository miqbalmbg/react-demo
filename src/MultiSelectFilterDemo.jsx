import {
  Button,
  ConfigProvider,
  Divider,
  Empty,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import './MultiSelectFilterDemo.css'

const demoArticles = [
  {
    id: 'react-concurrency',
    title: 'Mastering React Concurrency Patterns',
    description:
      'Discover practical approaches for orchestrating concurrent UI flows in modern React apps.',
    tags: ['React', 'UI', 'Performance'],
  },
  {
    id: 'vite-insights',
    title: 'Shipping Faster with Vite and Module Federation',
    description:
      'How a modular build setup speeds up deploys without sacrificing bundle quality.',
    tags: ['Vite', 'Tooling', 'Performance'],
  },
  {
    id: 'design-systems',
    title: 'Curating a Maintainable Design System',
    description:
      'Strategies for aligning product teams around a single source of truth for UI components.',
    tags: ['Design Systems', 'UI', 'Collaboration'],
  },
  {
    id: 'data-fetching',
    title: 'Progressive Data Fetching Recipes',
    description:
      'A tour of patterns that keep interfaces responsive while dealing with slow networks.',
    tags: ['React', 'Networking'],
  },
  {
    id: 'analytics',
    title: 'Instrumenting Product Analytics with Edge Functions',
    description:
      'Use edge runtime primitives to capture meaningful product signals in real time.',
    tags: ['Analytics', 'Edge', 'Performance'],
  },
]

const ALL_TAGS = Array.from(
  new Set(demoArticles.flatMap((article) => article.tags))
).sort((a, b) => a.localeCompare(b))

function MultiSelectFilterDemo() {
  const [draftTags, setDraftTags] = useState([])
  const [appliedTags, setAppliedTags] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const orderedOptions = useMemo(() => {
    const selected = [...draftTags].sort((a, b) => a.localeCompare(b))
    const unselected = ALL_TAGS.filter((tag) => !draftTags.includes(tag)).sort(
      (a, b) => a.localeCompare(b)
    )

    return [...selected, ...unselected].map((tag) => ({
      label: tag,
      value: tag,
    }))
  }, [draftTags])

  const selectionDisplayText = useMemo(() => {
    if (draftTags.length === 0) {
      return 'Select the Option(s)'
    }

    if (draftTags.length === 1) {
      return draftTags[0]
    }

    return 'Multiple Options is Selected'
  }, [draftTags])

  const filteredArticles = useMemo(() => {
    if (appliedTags.length === 0) {
      return demoArticles
    }

    return demoArticles.filter((article) =>
      appliedTags.every((tag) => article.tags.includes(tag))
    )
  }, [appliedTags])

  const hasPendingChanges =
    draftTags.length !== appliedTags.length ||
    draftTags.some((tag) => !appliedTags.includes(tag))

  const applyDraft = () => {
    setAppliedTags([...draftTags])
    setIsDropdownOpen(false)
  }

  const handlePrimaryAction = () => {
    if (draftTags.length === 0) {
      setDraftTags(ALL_TAGS)
      setAppliedTags(ALL_TAGS)
      setIsDropdownOpen(false)
      return
    }

    applyDraft()
  }

  const handleClear = () => {
    setDraftTags([])
    setAppliedTags([])
    setIsDropdownOpen(false)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorBgContainer: '#ffffff',
          colorText: '#0f172a',
          colorTextSecondary: 'rgba(30, 41, 59, 0.65)',
          borderRadius: 12,
          fontFamily:
            'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Select: {
            colorTextPlaceholder: 'rgba(51, 65, 85, 0.6)',
            colorBorder: 'rgba(148, 163, 184, 0.45)',
          },
        },
      }}
    >
      <div className="demo-shell">
        <div className="filter-card">
          <Typography.Title level={3} className="filter-title">
            Ant Design Multi-Select Filter
          </Typography.Title>
          <Typography.Paragraph className="filter-description">
            Choose one or more tags to see how the list below filters to match
            every selected criterion. Clear the field to show all content.
          </Typography.Paragraph>

          <div className="filter-select-group">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select the Option(s)"
              maxTagCount={0}
              maxTagPlaceholder={() => (
                <span className="filter-select-display">
                  {selectionDisplayText}
                </span>
              )}
              value={draftTags}
              onChange={(value) => setDraftTags(value ?? [])}
              options={orderedOptions}
              className="filter-select"
              open={isDropdownOpen}
              onDropdownVisibleChange={(open) => setIsDropdownOpen(open)}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div className="filter-dropdown-actions">
                    <Button
                      type="primary"
                      block
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handlePrimaryAction()
                      }}
                      disabled={draftTags.length > 0 && !hasPendingChanges}
                    >
                      {draftTags.length === 0 ? 'Select all' : 'Apply'}
                    </Button>
                    <Button
                      block
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleClear()
                      }}
                      disabled={
                        appliedTags.length === 0 && draftTags.length === 0
                      }
                    >
                      Clear all
                    </Button>
                  </div>
                </>
              )}
            />
            <Typography.Text type="secondary" className="filter-count">
              Showing {filteredArticles.length} of {demoArticles.length}{' '}
              resources
            </Typography.Text>
            {hasPendingChanges && (
              <Typography.Text className="filter-pending">
                Pending changes not yet applied.
              </Typography.Text>
            )}
          </div>

          <Divider className="filter-divider" />

          {filteredArticles.length ? (
            <div className="filter-results">
              {filteredArticles.map((article) => (
                <article key={article.id} className="filter-article">
                  <Typography.Title level={4} className="filter-article-title">
                    {article.title}
                  </Typography.Title>
                  <Typography.Paragraph className="filter-article-description">
                    {article.description}
                  </Typography.Paragraph>
                  <Space size={[8, 8]} wrap>
                    {article.tags.map((tag) => (
                      <Tag key={tag} color="geekblue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              description="No resources match the selected tags"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="filter-empty"
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}

export default MultiSelectFilterDemo
