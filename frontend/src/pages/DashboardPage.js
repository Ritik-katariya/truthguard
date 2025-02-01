import React from 'react';
import { Link } from 'react-router-dom';
import { getAnalysisHistory, clearHistory } from '../services/api';
import './DashboardPage.css';

function DashboardPage() {
    const history = getAnalysisHistory();

    const handleClearHistory = () => {
        clearHistory();
        window.location.reload();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (score) => {
        if (score >= 70) return '#28a745';  // Green for high credibility
        if (score >= 40) return '#ffc107';  // Yellow for medium credibility
        return '#dc3545';                   // Red for low credibility
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Analysis History</h1>
                <div className="header-actions">
                    <Link to="/" className="back-button">Back to Analyzer</Link>
                    {history.length > 0 && (
                        <button onClick={handleClearHistory} className="clear-button">
                            Clear History
                        </button>
                    )}
                </div>
            </header>

            <main className="history-content">
                {history.length === 0 ? (
                    <div className="no-history">
                        <p>No analysis history available</p>
                        <Link to="/" className="start-analysis">Start Your First Analysis</Link>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.map((item, index) => (
                            <div key={index} className="history-item">
                                <div className="history-meta">
                                    <span className="timestamp">{formatDate(item.timestamp)}</span>
                                    <span className={`content-type ${item.contentAnalysis.isNews ? 'news' : 'not-news'}`}>
                                        {item.contentAnalysis.contentType}
                                    </span>
                                </div>
                                <div className="content-preview">
                                    {item.content.substring(0, 200)}...
                                </div>
                                <div className="analysis-summary">
                                    {item.contentAnalysis.isNews && (
                                        <>
                                            <div className="metric">
                                                <span>Credibility:</span>
                                                <strong style={{ color: getStatusColor(item.credibilityMetrics.credibilityScore) }}>
                                                    {item.credibilityMetrics.credibilityScore}%
                                                </strong>
                                            </div>
                                            <div className="metric">
                                                <span>Truth Score:</span>
                                                <strong style={{ color: getStatusColor(item.credibilityMetrics.truthScore) }}>
                                                    {item.credibilityMetrics.truthScore}%
                                                </strong>
                                            </div>
                                            {item.sourceAnalysis?.verification && (
                                                <div className="metric">
                                                    <span>Source Reliability:</span>
                                                    <strong style={{ color: getStatusColor(item.sourceAnalysis.verification.confidence) }}>
                                                        {item.sourceAnalysis.verification.reliability}
                                                    </strong>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;
