import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';
import { checkContent } from '../services/api';

function Homepage() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(() => {
        const savedResult = sessionStorage.getItem('lastAnalysisResult');
        return savedResult ? JSON.parse(savedResult) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const categoryExplanations = {
        Factual: "Content appears to be based on verifiable facts and evidence",
        Misleading: "Content may contain partial truths but is presented in a way that could deceive",
        Opinion: "Content represents personal views rather than objective facts",
        False: "Content contains information that appears to be incorrect"
    };

    const handleCheck = async () => {
        if (!input.trim()) {
            setError('Please enter some content to verify');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const analysisResult = await checkContent(input);
            
            if (!analysisResult || !analysisResult.contentAnalysis) {
                throw new Error('Invalid response format from analysis');
            }

            const transformedResult = {
                ...analysisResult,
                verificationResult: analysisResult.verificationResult || {
                    labels: [],
                    scores: []
                },
                credibilityMetrics: {
                    ...analysisResult.credibilityMetrics,
                    credibilityScore: analysisResult.credibilityMetrics?.credibilityScore || 0,
                    truthScore: analysisResult.credibilityMetrics?.truthScore || 0
                },
                sourceAnalysis: {
                    ...analysisResult.sourceAnalysis,
                    sources: analysisResult.sourceAnalysis?.sources || [],
                    verification: analysisResult.sourceAnalysis?.verification || null
                }
            };

            setResult(transformedResult);
            sessionStorage.setItem('lastAnalysisResult', JSON.stringify(transformedResult));
        } catch (error) {
            console.error('Error Details:', error);
            const errorMessage = error.response?.data?.details || 
                               error.response?.data?.error || 
                               error.message || 
                               'Failed to analyze content';
            setError(errorMessage);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (result) {
                sessionStorage.setItem('lastAnalysisResult', JSON.stringify(result));
            }
        };
    }, [result]);

    const getStatusColor = (score) => {
        if (score >= 70) return '#28a745';  // Green for high credibility
        if (score >= 40) return '#ffc107';  // Yellow for medium credibility
        return '#dc3545';                   // Red for low credibility
    };

    const renderContentTypeAlert = (contentAnalysis) => {
        if (!contentAnalysis.isNews) {
            return (
                <div className="content-type-alert" style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>Note:</strong> This content appears to be a {contentAnalysis.contentType} rather than a news article.
                    Confidence: {contentAnalysis.confidence}%
                </div>
            );
        }
        return null;
    };

    const TruthMeter = ({ score }) => {
        const getGradientColor = (score) => {
            if (score >= 70) return '#28a745';  // Green for highly true
            if (score >= 50) return '#ffc107';  // Yellow for uncertain
            return '#dc3545';                   // Red for likely false
        };

        const getTruthLabel = (score) => {
            if (score >= 70) return 'Likely True';
            if (score >= 50) return 'Uncertain';
            return 'Likely False';
        };

        return (
            <div className="truth-meter">
                <h4>Truth Meter</h4>
                <div className="meter-container">
                    <div className="meter-scale">
                        <div className="meter-gradient"></div>
                        <div 
                            className="meter-pointer"
                            style={{ 
                                left: `${score}%`,
                                backgroundColor: getGradientColor(score)
                            }}
                        >
                            <div className="pointer-label">{score}%</div>
                        </div>
                    </div>
                    <div className="meter-labels">
                        <span className="false-label">False</span>
                        <span className="uncertain-label">Uncertain</span>
                        <span className="true-label">True</span>
                    </div>
                    <div className="truth-verdict" style={{ color: getGradientColor(score) }}>
                        {getTruthLabel(score)}
                    </div>
                </div>
            </div>
        );
    };

    const renderCredibilityMetrics = (metrics) => {
        if (!metrics) return null;

        return (
            <div className="credibility-metrics">
                <h4>Content Credibility Analysis</h4>
                
                <TruthMeter score={metrics.truthScore} />
                
                <div className="metrics-grid">
                    <div className="metric-item">
                        <span className="metric-label">Overall Credibility</span>
                        <div className="metric-value" style={{ color: getStatusColor(metrics.credibilityScore) }}>
                            {metrics.credibilityScore}%
                        </div>
                        <div className="metric-bar">
                            <div 
                                className="metric-fill" 
                                style={{ 
                                    width: `${metrics.credibilityScore}%`,
                                    backgroundColor: getStatusColor(metrics.credibilityScore)
                                }}
                            />
                        </div>
                    </div>

                    {metrics.reliability && (
                        <div className="metric-item">
                            <span className="metric-label">Reliability ({metrics.reliability.label})</span>
                            <div className="metric-value" style={{ color: getStatusColor(metrics.reliability.score) }}>
                                {metrics.reliability.score}%
                            </div>
                            <div className="metric-bar">
                                <div 
                                    className="metric-fill" 
                                    style={{ 
                                        width: `${metrics.reliability.score}%`,
                                        backgroundColor: getStatusColor(metrics.reliability.score)
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {metrics.authenticity && (
                        <div className="metric-item">
                            <span className="metric-label">Authenticity ({metrics.authenticity.level})</span>
                            <div className="metric-value" style={{ color: getStatusColor(metrics.authenticity.score) }}>
                                {metrics.authenticity.score}%
                            </div>
                            <div className="metric-bar">
                                <div 
                                    className="metric-fill" 
                                    style={{ 
                                        width: `${metrics.authenticity.score}%`,
                                        backgroundColor: getStatusColor(metrics.authenticity.score)
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const SourceAnalysis = ({ sourceAnalysis }) => {
        if (!sourceAnalysis || !sourceAnalysis.sources.length) {
            return (
                <div className="source-analysis no-sources">
                    <h4>Source Analysis</h4>
                    <p>No identifiable sources found in the content.</p>
                </div>
            );
        }

        const getSourceIcon = (type) => {
            switch (type) {
                case 'Major News Agency': return '📰';
                case 'Social Media': return '📱';
                case 'Website': return '🌐';
                case 'Cited Source': return '📝';
                default: return '📄';
            }
        };

        const getReliabilityColor = (status) => {
            if (status?.includes('reliable')) return '#28a745';
            if (status?.includes('unreliable')) return '#dc3545';
            return '#ffc107';
        };

        return (
            <div className="source-analysis">
                <h4>Source Analysis</h4>
                <div className="sources-list">
                    {sourceAnalysis.sources.map((source, index) => (
                        <div key={index} className="source-item">
                            <span className="source-icon">{getSourceIcon(source.type)}</span>
                            <div className="source-details">
                                <span className="source-name">{source.name}</span>
                                <span className="source-type">{source.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
                {sourceAnalysis.verification && (
                    <div className="source-reliability" 
                         style={{ color: getReliabilityColor(sourceAnalysis.verification.reliability) }}>
                        <span className="reliability-label">Source Reliability:</span>
                        <span className="reliability-value">
                            {sourceAnalysis.verification.reliability} 
                            ({sourceAnalysis.verification.confidence}% confidence)
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const NewsVerification = ({ newsVerification }) => {
        if (!newsVerification) return null;

        const getVerdictColor = (verdict) => {
            return verdict === 'REAL' ? '#28a745' : '#dc3545';
        };

        return (
            <div className="news-verification">
                <h4>News Verification</h4>
                <div className="verdict" style={{ color: getVerdictColor(newsVerification.verdict) }}>
                    <strong>Verdict: {newsVerification.verdict}</strong>
                    <span className="confidence">Confidence: {newsVerification.confidence}%</span>
                </div>
                
                {newsVerification.matchedArticles.length > 0 && (
                    <div className="matched-articles">
                        <h5>Similar Articles Found:</h5>
                        {newsVerification.matchedArticles.map((article, index) => (
                            <div key={index} className="article">
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </a>
                                <div className="article-meta">
                                    <span>{article.source}</span>
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderResult = () => {
        if (!result) return null;

        try {
            return (
                <div className="result">
                    <h3>Content Analysis Result</h3>
                    
                    {renderContentTypeAlert(result.contentAnalysis)}
                    
                    {result.contentAnalysis.isNews && (
                        <>
                            <SourceAnalysis sourceAnalysis={result.sourceAnalysis} />
                            {renderCredibilityMetrics(result.credibilityMetrics)}
                            
                            {result.verificationResult && result.verificationResult.labels && (
                                <div className="detailed-results">
                                    <h4>Verification Details</h4>
                                    <div className="verification-breakdown">
                                        {result.verificationResult.labels.map((label, index) => (
                                            <div key={label} className="verification-item">
                                                <div className="verification-label">
                                                    {label.charAt(0).toUpperCase() + label.slice(1)}
                                                    <div className="label-explanation">
                                                        {categoryExplanations[label.charAt(0).toUpperCase() + label.slice(1)] || 
                                                         'Classification category'}
                                                    </div>
                                                </div>
                                                <div className="verification-bar-container">
                                                    <div 
                                                        className="verification-bar"
                                                        style={{
                                                            width: `${Math.round((result.verificationResult.scores[index] || 0) * 100)}%`,
                                                            backgroundColor: getStatusColor((result.verificationResult.scores[index] || 0) * 100)
                                                        }}
                                                    />
                                                    <span className="verification-percentage">
                                                        {Math.round((result.verificationResult.scores[index] || 0) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <NewsVerification newsVerification={result.newsVerification} />
                </div>
            );
        } catch (error) {
            console.error('Error rendering result:', error);
            return (
                <div className="error-message">
                    Error displaying results. Please try again.
                </div>
            );
        }
    };

    return (
        <div className="homepage">
            <header className="header">
                <h1>TruthGuard</h1>
                <p>Your trusted content verification platform</p>
            </header>

            <main className="content-checker">
                <div className="input-section">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter content to verify..."
                        rows="6"
                        disabled={loading}
                    />
                    {error && <div className="error-message">{error}</div>}
                    <button 
                        onClick={handleCheck} 
                        disabled={loading || !input.trim()}
                        className={loading ? 'loading' : ''}
                    >
                        {loading ? 'Analyzing...' : 'Verify Content'}
                    </button>
                </div>

                {renderResult()}
            </main>

            <footer className="footer">
                <Link to="/dashboard" className="dashboard-link">
                    View Analysis History
                </Link>
            </footer>
        </div>
    );
}

export default Homepage;
