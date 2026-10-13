import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildStudyLinkAiResponse, getAllCatalogCourses } from '../lib/studylinkContent';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';

function StudyLinkAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCourseCode, setSelectedCourseCode] = useState(searchParams.get('course') || 'APT3060');
  const [question, setQuestion] = useState('Give me notes and revision guidance for this course.');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedTab, setSelectedTab] = useState<'guidance' | 'resources'>('guidance');
  const courses = getAllCatalogCourses();

  const response = useMemo(
    () => buildStudyLinkAiResponse(question, selectedCourseCode),
    [selectedCourseCode, question],
  );

  const activeCourse = courses.find((course) => course.code === selectedCourseCode) || courses[0];

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          className="page-header--ai"
          eyebrow="StudyLink AI"
          title="Quick course guidance, notes, and revision steps without leaving the app."
          description="Ask for summaries, study direction, and resource recommendations in one place."
          stats={[
            { value: courses.length, label: 'Courses in AI support catalog' },
            { value: activeCourse.resources.length, label: 'Linked study resources' },
          ]}
        />

        <section className="detail-panel">
          <div className="section-header">
            <h2>Ask for what you need</h2>
            <span className="panel-pill">{selectedCourseCode}</span>
          </div>
          <div className="form-grid form-grid-two">
            <label>
              Course
              <select value={selectedCourseCode} onChange={(event) => setSelectedCourseCode(event.target.value)}>
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prompt idea
              <select value={question} onChange={(event) => setQuestion(event.target.value)}>
                {activeCourse.aiPrompts.map((prompt) => (
                  <option key={prompt} value={prompt}>{prompt}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.6rem' }}>
            Your question
            <textarea
              className="studylink-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask for notes, summaries, MCQs, explanations, or revision steps."
            />
          </label>

          <div className="detail-action-row">
            <span className="panel-pill" style={{ fontSize: '0.9rem' }}>
              Guidance updates live as you type.
            </span>
          </div>
        </section>

        <section className="detail-panel">
          <div className="hub-tab-bar">
            {['guidance', 'resources'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`hub-tab-button ${selectedTab === tab ? 'hub-tab-active' : ''}`}
                onClick={() => setSelectedTab(tab as 'guidance' | 'resources')}
              >
                {tab === 'guidance' ? 'AI guidance' : 'AI resources'}
              </button>
            ))}
          </div>
        </section>

        {selectedTab === 'guidance' ? (
          <section className="detail-panel">
            <div className="section-header">
              <h2>{response.headline}</h2>
              <span className="panel-pill">AI study response</span>
            </div>
            <p>{response.explanation}</p>
            <Card.Section label="Focus areas">
              <ul className="detail-list compact-list">
                {response.focusAreas?.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </Card.Section>
            <Card.Section label="Study tips">
              <ul className="detail-list compact-list">
                {response.studyTips?.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Card.Section>
            <Card.Section label="Action steps">
              <ul className="detail-list compact-list">
                {response.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </Card.Section>
            <Card.Section label="Peer advice">{response.peerAdvice}</Card.Section>
          </section>
        ) : (
          <section className="detail-panel">
            <div className="section-header">
              <h2>Recommended resources</h2>
              <span className="panel-pill">{response.recommendedResources.length}</span>
            </div>
            <div className="detail-card-grid">
              {response.recommendedResources.map((resource) => {
                const resourceUrl = resource.url || resource.fallbackUrl;
                return (
                  <Card key={resource.id} variant="outlined" className="detail-summary-card">
                    <strong>{resource.title}</strong>
                    <p>{resource.description}</p>
                    <span>{resource.type} · {resource.audience}</span>
                    <div className="detail-action-row">
                      <button
                        type="button"
                        className="button button-secondary button-sm"
                        onClick={() => setSelectedResourceId(String(resource.id))}
                      >
                        Preview
                      </button>
                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-primary button-sm"
                        >
                          Open resource
                        </a>
                      ) : (
                        <button type="button" className="button button-primary button-sm" disabled>
                          No URL
                        </button>
                      )}
                      {/* in-app fallback button removed */}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {selectedTab === 'resources' && selectedResourceId ? (
          <section className="detail-panel">
            <div className="section-header">
              <h2>Resource preview</h2>
              <span className="panel-pill">Live preview</span>
            </div>
            {(() => {
              const selectedResource = response.recommendedResources.find((item) => String(item.id) === selectedResourceId);
              if (!selectedResource) {
                return <p>Selected resource could not be found.</p>;
              }

              const resourceUrl = selectedResource.url || selectedResource.fallbackUrl;
              const isDataPreview = typeof resourceUrl === 'string' && resourceUrl.startsWith('data:');

              return (
                <>
                  <p>{selectedResource.description}</p>
                  {isDataPreview ? (
                    <iframe
                      title={selectedResource.title}
                      src={resourceUrl}
                      className="resource-preview-frame"
                      sandbox="allow-same-origin allow-scripts allow-popups"
                    />
                  ) : resourceUrl ? (
                    <div className="detail-summary-card">
                      <p>This resource is available to open directly.</p>
                      <div className="detail-action-row">
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-primary button-sm"
                        >
                          Open resource
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-summary-card">
                      <p>This resource has no URL to open.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default StudyLinkAI;
