import { ConfigProvider, Layout, Menu } from 'antd'
import { useState } from 'react'
import 'antd/dist/reset.css'
import GeocodeSearchDemo from './GeocodeSearchDemo'
import ReverseGeocodeDemo from './ReverseGeocodeDemo'
import MultiSelectFilterDemo from './MultiSelectFilterDemo'
import TextTypingDemo from './TextTypingDemo'
import './App.css'

const { Sider, Content } = Layout

const menuItems = [
  {
    key: 'typing',
    label: 'Typing animation',
  },
  {
    key: 'filter',
    label: 'Multi-select filter',
  },
  {
    key: 'geocode',
    label: 'Geocode lookup',
  },
  {
    key: 'reverse',
    label: 'Reverse geocode',
  },
]

const demoComponents = {
  typing: <TextTypingDemo />,
  filter: <MultiSelectFilterDemo />,
  geocode: <GeocodeSearchDemo />,
  reverse: <ReverseGeocodeDemo />,
}

function App() {
  const [activeKey, setActiveKey] = useState('typing')

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#38bdf8',
          colorBgContainer: 'rgba(15, 23, 42, 0.9)',
          colorText: '#e2e8f0',
          colorTextSecondary: 'rgba(226, 232, 240, 0.7)',
          borderRadius: 16,
          fontFamily:
            'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: 'rgba(2, 6, 23, 0.85)',
          },
        },
      }}
    >
      <Layout className="app-layout">
        <Sider
          className="app-sider"
          breakpoint="lg"
          collapsedWidth="0"
          width={240}
        >
          <div className="sider-header">
            <span className="sider-logo">React Demo Lab</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => setActiveKey(key)}
            items={menuItems}
            className="app-menu"
          />
        </Sider>
        <Layout>
          <Content className="app-content">
            <div className="content-inner">{demoComponents[activeKey]}</div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default App
