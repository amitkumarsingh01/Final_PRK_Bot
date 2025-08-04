# --- Main Project Model (from 'project_initiation') ---
class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, unique=True, index=True)
    project_name = Column(String, index=True); sponsor = Column(String); objective = Column(String); start_date = Column(String); budget = Column(Float); status = Column(String); project_manager = Column(String); stakeholders = Column(SQLiteJSON); remarks = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    planning = relationship("ProjectPlanning", backref="project", uselist=False, cascade="all, delete-orphan")
    closure = relationship("ProjectClosure", backref="project", uselist=False, cascade="all, delete-orphan")
    team_allocations = relationship("TeamAllocation", backref="project", cascade="all, delete-orphan")
    tasks = relationship("Task", backref="project", cascade="all, delete-orphan")
    monitoring_logs = relationship("MonitoringLog", backref="project", cascade="all, delete-orphan")
    documents = relationship("Document", backref="project", cascade="all, delete-orphan")
    depreciations = relationship("Depreciation", backref="project", cascade="all, delete-orphan")


# --- Child Models for other project phases ---
class ProjectPlanning(Base):
    __tablename__ = "project_planning"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    plan_id = Column(String); scope = Column(String); milestones = Column(JSON); start_date = Column(String); end_date = Column(String); resources_required = Column(JSON); risk_assessment = Column(String); status = Column(String); remarks = Column(String)

class TeamAllocation(Base):
    __tablename__ = "team_allocations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    allocation_id = Column(String); team_member = Column(String); role = Column(String); allocation_start_date = Column(String); allocation_end_date = Column(String); hours_allocated = Column(Integer); department = Column(String); status = Column(String); remarks = Column(String)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    task_id = Column(String); task_description = Column(String); assigned_to = Column(String); start_date = Column(String); due_date = Column(String); progress = Column(Integer); status = Column(String); priority = Column(String); remarks = Column(String)

class MonitoringLog(Base):
    __tablename__ = "monitoring_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    monitor_id = Column(String); kpi_metric = Column(String); target = Column(Float); actual = Column(Float); variance = Column(Float); date_checked = Column(String); status = Column(String); remarks = Column(String)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    document_id = Column(String); document_type = Column(String); title = Column(String); created_date = Column(String); author = Column(String); status = Column(String); storage_location = Column(String); remarks = Column(String)

class ProjectClosure(Base):
    __tablename__ = "project_closures"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    closure_id = Column(String); completion_date = Column(String); final_budget = Column(Float); deliverables = Column(JSON); lessons_learned = Column(String); status = Column(String); remarks = Column(String)

class Depreciation(Base):
    __tablename__ = "depreciations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_db_id = Column(String, ForeignKey("projects.id"), nullable=False)
    depreciation_id = Column(String); asset_id = Column(String); asset_name = Column(String); purchase_date = Column(String); purchase_cost = Column(Float); depreciation_method = Column(String); annual_depreciation = Column(Float); current_value = Column(Float); replacement_date = Column(String); status = Column(String); remarks = Column(String)


# --- Base Schemas for each part of the project ---
class ProjectInitiationSchema(BaseModel):
    project_id: str; project_name: str; sponsor: str; objective: str; start_date: str; budget: float; status: str; project_manager: str; stakeholders: List[str]; remarks: str
class ProjectPlanningSchema(BaseModel):
    plan_id: str; scope: str; milestones: List[str]; start_date: str; end_date: str; resources_required: List[str]; risk_assessment: str; status: str; remarks: str
class TeamAllocationSchema(BaseModel):
    allocation_id: str; team_member: str; role: str; allocation_start_date: str; allocation_end_date: str; hours_allocated: int; department: str; status: str; remarks: str
class TaskSchema(BaseModel):
    task_id: str; task_description: str; assigned_to: str; start_date: str; due_date: str; progress: int; status: str; priority: str; remarks: str
class MonitoringLogSchema(BaseModel):
    monitor_id: str; kpi_metric: str; target: float; actual: float; variance: float; date_checked: str; status: str; remarks: str
class DocumentSchema(BaseModel):
    document_id: str; document_type: str; title: str; created_date: str; author: str; status: str; storage_location: str; remarks: str
class ProjectClosureSchema(BaseModel):
    closure_id: str; completion_date: str; final_budget: float; deliverables: List[str]; lessons_learned: str; status: str; remarks: str
class DepreciationSchema(BaseModel):
    depreciation_id: str; asset_id: str; asset_name: str; purchase_date: str; purchase_cost: float; depreciation_method: str; annual_depreciation: float; current_value: float; replacement_date: str; status: str; remarks: str

# --- Schemas for Partial Updates ---
class ProjectInitiationUpdateSchema(BaseModel):
    project_name: Optional[str] = None; sponsor: Optional[str] = None; objective: Optional[str] = None; start_date: Optional[str] = None; budget: Optional[float] = None; status: Optional[str] = None; project_manager: Optional[str] = None; stakeholders: Optional[List[str]] = None; remarks: Optional[str] = None
class ProjectPlanningUpdateSchema(BaseModel):
    plan_id: Optional[str] = None; scope: Optional[str] = None; milestones: Optional[List[str]] = None; start_date: Optional[str] = None; end_date: Optional[str] = None; resources_required: Optional[List[str]] = None; risk_assessment: Optional[str] = None; status: Optional[str] = None; remarks: Optional[str] = None
class ProjectClosureUpdateSchema(BaseModel):
    closure_id: Optional[str] = None; completion_date: Optional[str] = None; final_budget: Optional[float] = None; deliverables: Optional[List[str]] = None; lessons_learned: Optional[str] = None; status: Optional[str] = None; remarks: Optional[str] = None

class ProjectUpdate(BaseModel):
    project_initiation: Optional[ProjectInitiationUpdateSchema] = None
    project_planning: Optional[ProjectPlanningUpdateSchema] = None
    team_allocations: Optional[List[TeamAllocationSchema]] = None
    tasks: Optional[List[TaskSchema]] = None
    monitoring_logs: Optional[List[MonitoringLogSchema]] = None
    documents: Optional[List[DocumentSchema]] = None
    depreciations: Optional[List[DepreciationSchema]] = None
    project_closure: Optional[ProjectClosureUpdateSchema] = None

# --- Schema for a new Project payload ---
class ProjectCreate(BaseModel):
    project_initiation: ProjectInitiationSchema
    project_planning: ProjectPlanningSchema
    team_allocations: List[TeamAllocationSchema] = []
    tasks: List[TaskSchema] = []
    monitoring_logs: List[MonitoringLogSchema] = []
    documents: List[DocumentSchema] = []
    depreciations: List[DepreciationSchema] = []
    project_closure: Optional[ProjectClosureSchema] = None

# --- Response Schemas (includes database-generated IDs) ---
class ProjectPlanningResponse(ProjectPlanningSchema): id: str
class TeamAllocationResponse(TeamAllocationSchema): id: str
class TaskResponse(TaskSchema): id: str
class MonitoringLogResponse(MonitoringLogSchema): id: str
class DocumentResponse(DocumentSchema): id: str
class ProjectClosureResponse(ProjectClosureSchema): id: str
class DepreciationResponse(DepreciationSchema): id: str

class ProjectResponse(ProjectInitiationSchema):
    id: str  # The database UUID
    created_at: datetime
    updated_at: datetime
    planning: Optional[ProjectPlanningResponse] = None
    closure: Optional[ProjectClosureResponse] = None
    team_allocations: List[TeamAllocationResponse] = []
    tasks: List[TaskResponse] = []
    monitoring_logs: List[MonitoringLogResponse] = []
    documents: List[DocumentResponse] = []
    depreciations: List[DepreciationResponse] = []
    
    class Config:
        from_attributes = True


Base.metadata.create_all(bind=engine)

@app.post("/projects/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, tags=["Projects"])
def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    try:
        # Create the main project
        db_project = Project(**project_data.project_initiation.dict())
        db.add(db_project)
        db.flush() # Flush to get the db_project.id for relationships

        # Create one-to-one relationships
        if project_data.project_planning:
            db_planning = ProjectPlanning(project_db_id=db_project.id, **project_data.project_planning.dict())
            db.add(db_planning)
        if project_data.project_closure:
            db_closure = ProjectClosure(project_db_id=db_project.id, **project_data.project_closure.dict())
            db.add(db_closure)
        
        # Create one-to-many relationships
        child_lists = {
            "team_allocations": (TeamAllocation, project_data.team_allocations),
            "tasks": (Task, project_data.tasks),
            "monitoring_logs": (MonitoringLog, project_data.monitoring_logs),
            "documents": (Document, project_data.documents),
            "depreciations": (Depreciation, project_data.depreciations)
        }
        for _, (model, items) in child_lists.items():
            for item_data in items:
                db_item = model(project_db_id=db_project.id, **item_data.dict())
                db.add(db_item)
                
        db.commit()
        db.refresh(db_project)
        return db_project
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@app.get("/projects/", response_model=List[ProjectResponse], tags=["Projects"])
def get_all_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@app.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_project_by_id(project_id: str, db: Session = Depends(get_db)):
    # Query by the user-facing project_id (e.g., "PI-001")
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def update_project(project_id: str, project_data: ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.project_id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # Update main project fields (one-to-one)
        if project_data.project_initiation:
            update_data = project_data.project_initiation.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_project, key, value)
        
        # Update planning fields (one-to-one)
        if project_data.project_planning:
            if db_project.planning:
                update_data = project_data.project_planning.dict(exclude_unset=True)
                for key, value in update_data.items():
                    setattr(db_project.planning, key, value)
            else: # If planning didn't exist, create it
                db_planning = ProjectPlanning(project_db_id=db_project.id, **project_data.project_planning.dict())
                db.add(db_planning)
        
        # Update closure fields (one-to-one)
        if project_data.project_closure:
            if db_project.closure:
                update_data = project_data.project_closure.dict(exclude_unset=True)
                for key, value in update_data.items():
                    setattr(db_project.closure, key, value)
            else: # If closure didn't exist, create it
                db_closure = ProjectClosure(project_db_id=db_project.id, **project_data.project_closure.dict())
                db.add(db_closure)
        
        # Update lists (one-to-many) using "delete and replace"
        child_lists_to_update = {
            "team_allocations": (TeamAllocation, project_data.team_allocations),
            "tasks": (Task, project_data.tasks),
            "monitoring_logs": (MonitoringLog, project_data.monitoring_logs),
            "documents": (Document, project_data.documents),
            "depreciations": (Depreciation, project_data.depreciations)
        }
        for field, (model, items) in child_lists_to_update.items():
            if items is not None: # Check if the list was provided in the payload
                # Delete existing items
                db.query(model).filter(model.project_db_id == db_project.id).delete(synchronize_session=False)
                # Add new items
                for item_data in items:
                    db_item = model(project_db_id=db_project.id, **item_data.dict())
                    db.add(db_item)

        db_project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_project)
        return db_project

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Projects"])
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        db.delete(project) # Cascade will delete all related data
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")