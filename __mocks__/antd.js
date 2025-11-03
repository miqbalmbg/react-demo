const React = require('react')

const ConfigProvider = ({ children }) => React.createElement(React.Fragment, null, children)

const Layout = ({ children, ...props }) =>
  React.createElement('div', { ...props, 'data-testid': props['data-testid'] ?? 'layout' }, children)

Layout.Sider = ({ children, breakpoint, collapsedWidth, width, ...rest }) => {
  const { 'data-testid': testId = 'layout-sider', ...props } = rest

  return React.createElement(
    'aside',
    {
      ...props,
      'data-testid': testId,
      'data-breakpoint': breakpoint,
      'data-collapsed-width': collapsedWidth,
      'data-width': width,
    },
    children,
  )
}

Layout.Content = ({ children, ...props }) =>
  React.createElement(
    'main',
    { ...props, 'data-testid': props['data-testid'] ?? 'layout-content' },
    children,
  )

const Menu = ({ items = [], onClick, selectedKeys = [] }) =>
  React.createElement(
    'nav',
    { 'data-testid': 'app-menu' },
    items.map((item) =>
      React.createElement(
        'button',
        {
          key: item.key,
          type: 'button',
          'data-active': selectedKeys.includes(item.key),
          onClick: () => onClick?.({ key: item.key }),
        },
        item.label,
      ),
    ),
  )

const Button = ({ children, onClick, type: variant = 'default', block: _block, ...props }) =>
  React.createElement('button', { ...props, type: 'button', 'data-variant': variant, onClick }, children)

const Divider = (props) => React.createElement('hr', props)

const Empty = ({ description, ...props }) =>
  React.createElement('div', { ...props, 'data-testid': 'empty-state' }, description)

Empty.PRESENTED_IMAGE_SIMPLE = 'empty-image'

const Select = ({
  options = [],
  value = [],
  onChange,
  dropdownRender,
  placeholder = 'open',
  allowClear,
  maxTagPlaceholder,
  open = false,
  onDropdownVisibleChange,
  className,
}) => {
  const toggleDropdown = () => {
    onDropdownVisibleChange?.(!open)
  }

  return React.createElement(
    'div',
    { className, 'data-testid': 'mock-select' },
    React.createElement(
      'button',
      { type: 'button', onClick: toggleDropdown, 'data-testid': 'toggle-dropdown' },
      placeholder,
    ),
    React.createElement(
      'div',
      { role: 'listbox' },
      options.map((option) =>
        React.createElement(
          'label',
          { key: option.value },
          React.createElement('input', {
            type: 'checkbox',
            checked: value.includes(option.value),
            onChange: (event) => {
              const isChecked = event.target.checked
              const nextValue = isChecked
                ? [...value, option.value]
                : value.filter((item) => item !== option.value)
              onChange?.(nextValue)
            },
          }),
          option.label,
        ),
      ),
    ),
    allowClear
      ? React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'clear-selection',
            onClick: () => onChange?.([]),
          },
          'Clear selection',
        )
      : null,
    maxTagPlaceholder ? React.createElement('span', { 'data-testid': 'max-tag-placeholder' }, maxTagPlaceholder()) : null,
    dropdownRender
      ? React.createElement(
          'div',
          { 'data-testid': 'dropdown-render' },
          dropdownRender(React.createElement('div', { role: 'menu' })),
        )
      : null,
  )
}

const Space = ({ children }) => React.createElement('div', { 'data-testid': 'space' }, children)

const Tag = ({ children, ...props }) =>
  React.createElement('span', { ...props, 'data-testid': 'tag' }, children)

const makeTypographyElement = (TagName) => ({ children, ...props }) =>
  React.createElement(TagName, props, children)

const Typography = makeTypographyElement('div')

Typography.Title = makeTypographyElement('h3')
Typography.Paragraph = makeTypographyElement('p')
Typography.Text = makeTypographyElement('span')

module.exports = {
  Button,
  ConfigProvider,
  Divider,
  Empty,
  Layout,
  Menu,
  Select,
  Space,
  Tag,
  Typography,
}
