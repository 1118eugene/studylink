import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, openResourceUrl } from '../lib/apiClient';
import { buildMergedCourses, getAllCatalogResources, getCatalogCourseByCode, getResourcesForCourse } from '../lib/studylinkContent';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';
import { addNotification } from '../lib/notifications';

type ResourceItem = {
  id: string | number;
  title: string;
  type: string;
  url: string;
  fallbackUrl?: string;
  description: string;
  usageNotes: string;
  audience: string;
  sourceNote?: string;
  downloads: number;
  courseCode?: string;
  school?: string;
  program?: string;
  isCatalog?: boolean;
  isApiResource?: boolean;
  courseTitle?: string;
  category?: string;
};

const HIDDEN_LIBRARY_KEY = 'studylink_hidden_library_resources_v1';

function loadHiddenResources() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(HIDDEN_LIBRARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function saveHiddenResources(ids: string[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(HIDDEN_LIBRARY_KEY, JSON.stringify(ids));
}

function getResourceCategory(resource: ResourceItem) {
  const type = String(resource.type || '').toLowerCase();
  if (type.includes('pdf')) return 'PDFs';
  if (type.includes('podcast')) return 'Podcasts';
  if (type.includes('video')) return 'Videos';
  if (type.includes('past')) return 'Past papers';
  if (type.includes('mcq')) return 'MCQs';
  if (type.includes('note')) return 'Notes';
  return 'Guides';
}

function buildCatalogResources() {
  return getAllCatalogResources().map((resource) => {
    const course = getCatalogCourseByCode(resource.courseCode);
    return {
      ...resource,
      downloads: 0,
      school: course?.school || 'General',
      program: course?.program || 'General Studies',
      courseTitle: course?.title || resource.courseCode,
      isCatalog: true,
      isApiResource: false,
      category: getResourceCategory(resource as ResourceItem),
    } satisfies ResourceItem;
  });
}

function LearningHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'library';
  const [selectedView, setSelectedView] = useState(initialView);
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [apiLibraryResources, setApiLibraryResources] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All schools');
  const [selectedType, setSelectedType] = useState('All types');
  const [hiddenResourceIds, setHiddenResourceIds] = useState<string[]>(() => loadHiddenResources());
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceSourceNote, setNewResourceSourceNote] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUploadStatus, setResourceUploadStatus] = useState<string>('');

  useEffect(() => {
    setSelectedView(initialView);
  }, [initialView]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const catalogResources = buildCatalogResources();

      try {
        const [coursesResponse, libraryResponse, resourcesResponse] = await Promise.all([
          apiFetch('/api/courses'),
          apiFetch('/api/my/resources'),
          apiFetch('/api/resources'),
        ]);

        if (!mounted) return;

        const courseData = coursesResponse.ok ? await coursesResponse.json() : { courses: [] };
        const libraryData = libraryResponse.ok ? await libraryResponse.json() : { resources: [] };
        const resourcesData = resourcesResponse.ok ? await resourcesResponse.json() : { resources: [] };

        setCatalogCourses(buildMergedCourses(courseData.courses || []));
        const libraryResourcesFromApi = (libraryData.resources || []).map((resource: any) => ({
          id: resource.id,
          title: resource.title,
          type: resource.type || 'Resource',
          url: resource.url,
          description: resource.description || 'Saved from your StudyLink activity.',
          usageNotes: resource.usageNotes || 'Open and review.',
          audience: resource.audience || 'All students',
          sourceNote: resource.sourceNote || '',
          downloads: resource.downloads || 0,
          courseCode: resource.courseCode || '',
          school: resource.school || 'General',
          program: resource.program || 'General Studies',
          courseTitle: resource.course || 'Saved resource',
          isCatalog: false,
          isApiResource: true,
          category: getResourceCategory(resource),
        }));

        setApiLibraryResources(libraryData.resources || []);
        setAllResources([
          ...catalogResources,
          ...(resourcesData.resources || []).map((resource: any) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type || 'Resource',
            url: resource.url,
            description: resource.description || 'Shared resource from the StudyLink backend.',
            usageNotes: resource.usageNotes || 'Open and review.',
            audience: resource.audience || 'All students',
            sourceNote: resource.sourceNote || '',
            downloads: resource.downloads || 0,
            courseCode: resource.courseCode || '',
            school: resource.school || 'General',
            program: resource.program || 'General Studies',
            courseTitle: resource.course || 'Shared resource',
            isCatalog: false,
            isApiResource: false,
            category: getResourceCategory(resource),
          })),
          ...libraryResourcesFromApi,
        ]);
      } catch {
        if (!mounted) return;
        setCatalogCourses(buildMergedCourses([]));
        setApiLibraryResources([]);
        setAllResources(catalogResources);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const enrolledCourses = useMemo(
    () => catalogCourses.filter((course) => course.isEnrolled),
    [catalogCourses],
  );

  const libraryResources = useMemo(() => {
    const recommendedResources = enrolledCourses.flatMap((course) =>
      getResourcesForCourse(course.code).map((resource) => ({
        ...resource,
        courseTitle: course.title,
        school: course.school,
        program: course.program,
        isCatalog: true,
        isApiResource: false,
        category: getResourceCategory(resource as ResourceItem),
        downloads: 0,
      })),
    );

    const savedResources = apiLibraryResources.map((resource) => ({
      id: String(resource.id),
      title: resource.title,
      type: resource.type || 'Resource',
      url: resource.url,
      description: resource.description || 'Saved from your StudyLink activity.',
      usageNotes: resource.usageNotes || 'Open and review.',
      audience: resource.audience || 'All students',
      sourceNote: resource.sourceNote || '',
      downloads: resource.downloads || 0,
      courseCode: resource.courseCode || '',
      courseTitle: resource.course || 'Saved resource',
      school: resource.school || 'General',
      program: resource.program || 'General Studies',
      isCatalog: false,
      isApiResource: true,
      category: getResourceCategory(resource),
    }));

    const dedupe = new Map<string, ResourceItem>();
    [...recommendedResources, ...savedResources].forEach((resource) => {
      dedupe.set(String(resource.id), resource);
    });

    return Array.from(dedupe.values()).filter((resource) => !hiddenResourceIds.includes(String(resource.id)));
  }, [apiLibraryResources, enrolledCourses, hiddenResourceIds]);

  const baseResources = selectedView === 'library' ? (libraryResources.length > 0 ? libraryResources : allResources) : allResources;

  const schoolOptions = useMemo(
    () => ['All schools', ...Array.from(new Set(baseResources.map((resource) => resource.school).filter(Boolean)))],
    [baseResources],
  );

  const typeOptions = useMemo(() => {
    const allTypes = Array.from(new Set(baseResources.map((resource) => resource.type).filter(Boolean)));
    return ['All types', ...allTypes];
  }, [baseResources]);

  const filteredResources = useMemo(() => {
    const resourceViewFilter = (resource: ResourceItem) => {
      if (selectedView === 'notes') return resource.category === 'Notes' || resource.category === 'PDFs';
      if (selectedView === 'podcasts') return resource.category === 'Podcasts';
      if (selectedView === 'practice') return resource.category === 'MCQs' || resource.category === 'Past papers';
      return true;
    };

    return baseResources.filter((resource) => {
      const schoolMatch = selectedSchool === 'All schools' || resource.school === selectedSchool;
      const typeMatch = selectedType === 'All types' || resource.type === selectedType;
      const searchMatch = [resource.title, resource.description, resource.courseCode, resource.courseTitle, resource.school, resource.program, resource.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return schoolMatch && typeMatch && searchMatch && resourceViewFilter(resource);
    });
  }, [baseResources, searchTerm, selectedSchool, selectedType, selectedView]);

  const handleAccess = async (resource: ResourceItem) => {
    const resourceUrl = resource.url || resource.fallbackUrl;
    if (resourceUrl) {
      try {
        await openResourceUrl(resourceUrl);
      } catch (error) {
        addNotification({
          id: `resource-open-error-${Date.now()}`,
          title: 'Unable to open resource',
          message: error instanceof Error ? error.message : 'Please try opening the resource again.',
          createdAt: new Date().toISOString(),
        });
      }
      return;
    }

    const id = String(resource.id);
    const queryParams = new URLSearchParams();
    if (resource.courseCode) queryParams.set('courseCode', resource.courseCode);

    navigate(`/resources/${encodeURIComponent(id)}?${queryParams.toString()}`);
  };

  const handleAddLibraryResource = async () => {
    if (!newResourceTitle) {
      setResourceUploadStatus('A title is required.');
      return;
    }

    let url = newResourceUrl;
    if (!url && newResourceFile) {
      setResourceUploading(true);
      setResourceUploadStatus('Uploading file...');
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(newResourceFile as Blob);
        });
        url = dataUrl.split(',')[1];
        const resp = await apiFetch('/api/uploads', {
          method: 'POST',
          body: JSON.stringify({ filename: newResourceFile.name, data: url }),
        });
        if (!resp.ok) {
          const errorJson = await resp.json().catch(() => null);
          throw new Error(errorJson?.message || 'Upload failed');
        }
        const json = await resp.json();
        url = json.url;
        setResourceUploadStatus('File uploaded successfully.');
      } catch (error) {
        setResourceUploadStatus('Upload failed. Please try again.');
        setResourceUploading(false);
        return;
      } finally {
        setResourceUploading(false);
      }
    }

    if (!url) {
      setResourceUploadStatus('Provide a URL or upload a file.');
      return;
    }

    try {
      const resp = await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: newResourceTitle,
          resourceType: newResourceUrl?.toLowerCase().includes('pdf') || newResourceFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Resource',
          url,
          description: '',
          usageNotes: 'Uploaded by user.',
          audience: 'All students',
          sourceNote: newResourceSourceNote,
        }),
      });
      if (!resp.ok) {
        const errorJson = await resp.json().catch(() => null);
        throw new Error(errorJson?.message || 'Unable to save resource.');
      }
      const created = await resp.json();
      const savedResource = created.resource;
      if (savedResource) {
        const newResourceItem = {
          id: savedResource.id,
          title: savedResource.title,
          type: savedResource.type || 'Resource',
          url: savedResource.url,
          description: savedResource.description || 'Uploaded learning resource.',
          usageNotes: savedResource.usageNotes || 'Open and review.',
          audience: savedResource.audience || 'All students',
          sourceNote: savedResource.sourceNote || newResourceSourceNote,
          downloads: savedResource.download_count || 0,
          courseCode: savedResource.courseCode || '',
          school: savedResource.school || 'General',
          program: savedResource.program || 'General Studies',
          courseTitle: savedResource.course || 'Shared resource',
          isCatalog: false,
          isApiResource: true,
          category: getResourceCategory(savedResource),
        };

        setApiLibraryResources((current) => [...current, savedResource]);
        setAllResources((current) => [...current, newResourceItem]);
      }
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceSourceNote('');
      setNewResourceFile(null);
      setResourceUploadStatus('Resource added successfully.');
    } catch (error) {
      setResourceUploadStatus('Failed to save resource.');
    }
  };

  const handleHide = async (resource: ResourceItem) => {
    if (resource.isApiResource) {
      try {
        const response = await apiFetch(`/api/my/resources/${resource.id}`, { method: 'DELETE' });
        if (response.status === 204) {
          setApiLibraryResources((current) => current.filter((item) => String(item.id) !== String(resource.id)));
        }
      } catch {
        // noop
      }
      return;
    }

    const next = [...hiddenResourceIds, String(resource.id)];
    setHiddenResourceIds(next);
    saveHiddenResources(next);
  };

  const updateView = (view: string) => {
    setSelectedView(view);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', view);
    setSearchParams(nextParams, { replace: true });
  };

  const viewTitle = selectedView === 'library'
    ? 'My learning shelf'
    : selectedView === 'notes'
      ? 'Notes and PDFs'
      : selectedView === 'podcasts'
        ? 'Podcasts and audio learning'
        : selectedView === 'practice'
          ? 'Practice and past papers'
          : 'All shared resources';

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          className="page-header--learning-hub"
          eyebrow="Learning Hub"
          title="Central library for notes, PDFs, quizzes, and shared study resources."
          description="Open what you need quickly and keep study materials in one place."
          stats={[
            { value: libraryResources.length, label: 'Library-ready resources' },
            { value: allResources.length, label: 'All learning resources' },
          ]}
        />

        <section className="workspace-toolbar">
          <div>
            <h2>{viewTitle}</h2>
            <p>Choose the learning area you want without leaving the same workspace.</p>
          </div>
          <div className="toolbar-actions">
            <select value={selectedView} onChange={(event) => updateView(event.target.value)} className="filter-select" aria-label="Choose learning hub view">
              <option value="library">My Library</option>
              <option value="resources">All Resources</option>
              <option value="notes">Notes and PDFs</option>
              <option value="podcasts">Podcasts</option>
              <option value="practice">Practice and Past Papers</option>
            </select>
            <Link to="/courses" className="button button-primary">Open courses</Link>
          </div>
        </section>

        <section className="resource-upload-panel">
          <h3>Add or upload a resource</h3>
          <div className="resource-upload-fields">
            <input
              placeholder="Title"
              value={newResourceTitle}
              onChange={(event) => setNewResourceTitle(event.target.value)}
              aria-label="Resource title"
            />
            <input
              placeholder="URL (optional if uploading)"
              value={newResourceUrl}
              onChange={(event) => setNewResourceUrl(event.target.value)}
              aria-label="Resource URL"
            />
            <input
              placeholder="Source / attribution note (optional)"
              value={newResourceSourceNote}
              onChange={(event) => setNewResourceSourceNote(event.target.value)}
              aria-label="Resource source or attribution note"
            />
            <input
              type="file"
              onChange={(event) => setNewResourceFile(event.target.files && event.target.files[0] ? event.target.files[0] : null)}
              aria-label="Choose a resource file"
            />
          </div>
          <div className="resource-upload-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleAddLibraryResource}
              disabled={resourceUploading}
            >
              {resourceUploading ? 'Uploading…' : 'Add / Upload resource'}
            </button>
            {resourceUploadStatus ? <p className="resource-upload-status" role="status" aria-live="polite">{resourceUploadStatus}</p> : null}
          </div>
        </section>

        <section className="workspace-toolbar library-toolbar">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search resources by title, course, school, or type"
            className="search-input"
            aria-label="Search resources by title, course, school, or type"
          />
          <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)} className="filter-select" aria-label="Filter resources by school">
            {schoolOptions.map((school) => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="filter-select" aria-label="Filter resources by type">
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading your learning hub...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <Card.Empty
            message="No matching learning materials found. Try another hub view or change your filters."
          />
        ) : (
          <div className="resource-library-grid">
            {filteredResources.map((resource) => (
              <Card key={`${resource.id}`} variant="elevated" className="resource-library-card">
                <Card.Header
                  overline={resource.category || resource.type}
                  title={resource.title}
                  subtitle={resource.courseCode || resource.courseTitle || resource.school}
                />
                <Card.Body>
                  <p>{resource.description}</p>
                  <Card.Meta className="resource-card-meta">
                    <div>
                      <span className="mini-label">School / Program</span>
                      <strong>{resource.school ? `${resource.school} - ${resource.program}` : resource.audience}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Usage</span>
                      <strong>{resource.usageNotes}</strong>
                    </div>
                    {resource.sourceNote ? (
                    <div>
                      <span className="mini-label">Source and attribution</span>
                      <strong>{resource.sourceNote}</strong>
                    </div>
                    ) : null}
                  </Card.Meta>
                </Card.Body>
                <Card.Footer className="detail-action-row">
                  <button type="button" className="button button-primary" onClick={() => handleAccess(resource)}>
                    Open
                  </button>
                  {selectedView === 'library' ? (
                    <button type="button" className="button button-secondary" onClick={() => handleHide(resource)}>
                      Hide
                    </button>
                  ) : null}
                </Card.Footer>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default LearningHub;
