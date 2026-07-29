import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildStudyLinkAiResponse, getAllCatalogCourses } from '../lib/studylinkContent';

function StudyLinkAI() {
  const [searchParams] = useSearchParams();
  const [selectedCourseCode, setSelectedCourseCode] = useState(searchParams.get('course') || 'APT3060');
  const [question, setQuestion] = useState('Give me notes and revision guidance for this course.');
  const [submittedQuestion, setSubmittedQuestion] = useState(question);
  const courses = getAllCatalogCourses();

  const response = useMemo(
    () => buildStudyLinkAiResponse(submittedQuestion, selectedCourseCode),
    [selectedCourseCode, submittedQuestion],
  );

  const activeCourse = courses.find((course) => course.code === selectedCourseCode) || courses[0];

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-dashboard">
          <div>
            <p className="workspace-eyebrow">StudyLink AI</p>
            <h1>Quick course guidance, notes, and revision steps without leaving the app.</h1>
            <p className="workspace-lead">
              Ask for summaries, study direction, and resource recommendations in one place.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Courses in AI support catalog</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{activeCourse.resources.length}</span>
              <span className="hero-stat-label">Linked study resources</span>
            </article>
          </div>
        </section>

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
            <button type="button" className="button button-primary" onClick={() => setSubmittedQuestion(question)}>
              Generate guidance
            </button>
          </div>
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>{response.headline}</h2>
            <span className="panel-pill">AI study response</span>
          </div>
          <p>{response.explanation}</p>
          <ul className="detail-list compact-list">
            {response.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="modal-note">
            <strong>Peer advice</strong>
            <p style={{ margin: '0.5rem 0 0' }}>{response.peerAdvice}</p>
          </div>
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Recommended resources</h2>
            <span className="panel-pill">{response.recommendedResources.length}</span>
          </div>
          <div className="detail-card-grid">
            {response.recommendedResources.map((resource) => (
              <article key={resource.id} className="detail-summary-card">
                <strong>{resource.title}</strong>
                <p>{resource.description}</p>
                <span>{resource.type} · {resource.audience}</span>
                <button type="button" className="button button-secondary button-sm" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
                  Open resource
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default StudyLinkAI;
