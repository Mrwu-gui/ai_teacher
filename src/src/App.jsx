import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ToolLibraryPage from './pages/ToolLibraryPage'
import ToolDetailPage from './pages/ToolDetailPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import WorkflowPage from './pages/WorkflowPage'
import WorkflowDetailPage from './pages/WorkflowDetailPage'
import WorkflowBuilderPage from './pages/WorkflowBuilderPage'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workflows" element={<WorkflowPage />} />
          <Route path="/workflows/custom/new" element={<WorkflowBuilderPage />} />
          <Route path="/workflows/:workflowId" element={<WorkflowDetailPage />} />
          <Route path="/tools" element={<ToolLibraryPage />} />
          <Route path="/tool/:id" element={<ToolDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
