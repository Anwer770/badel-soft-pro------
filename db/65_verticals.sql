/* =====================================================================
   65_verticals.sql — وحدات القطاعات (اختيارية، تُثبَّت حسب النشاط)
   يعادل: SalTable, Garsone, parts, BillRest, hotel, room, roomReserves,
          personalData, roomCheck, doctor, nurse, rateDoctor, classAge,
          rateservice, billDoctor, FacModal, FacMat, Fmat, stages, stageQ,
          counters, reading
   ملاحظة: تُستخدم جداول الفواتير الموحّدة (invoices) لهذه القطاعات،
           مع MetadataJson لبياناتها الخاصة (رقم الطاولة، الغرفة، الطبيب...).
   ===================================================================== */
USE BadelErp;
GO

IF OBJECT_ID(N'dbo.restaurant_tables', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.restaurant_tables
    (
        TableId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_restaurant_tables PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        BranchId   INT               NULL,
        Code       NVARCHAR(20)      NOT NULL,
        NameAr     NVARCHAR(80)      NOT NULL,
        SectionName NVARCHAR(80)     NULL,
        Seats      TINYINT           NULL,
        Status     NVARCHAR(20)      NOT NULL CONSTRAINT DF_restaurant_tables_Status DEFAULT (N'free'),
        CONSTRAINT UQ_restaurant_tables_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_restaurant_tables_Status CHECK (Status IN (N'free', N'occupied', N'reserved')),
        CONSTRAINT FK_restaurant_tables_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_restaurant_tables_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId)
    );
END;
GO

IF OBJECT_ID(N'dbo.hotel_rooms', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.hotel_rooms
    (
        RoomId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_hotel_rooms PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        BranchId   INT               NULL,
        RoomNo     NVARCHAR(20)      NOT NULL,
        RoomType   NVARCHAR(60)      NULL,
        FloorNo    NVARCHAR(20)      NULL,
        Beds       TINYINT           NULL,
        NightPrice DECIMAL(18,4)     NOT NULL CONSTRAINT DF_hotel_rooms_Price DEFAULT (0),
        Status     NVARCHAR(20)      NOT NULL CONSTRAINT DF_hotel_rooms_Status DEFAULT (N'available'),
        CONSTRAINT UQ_hotel_rooms_No UNIQUE (CompanyId, RoomNo),
        CONSTRAINT CK_hotel_rooms_Status CHECK (Status IN (N'available', N'occupied', N'maintenance', N'reserved')),
        CONSTRAINT FK_hotel_rooms_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_hotel_rooms_branches FOREIGN KEY (BranchId) REFERENCES dbo.branches (BranchId)
    );
END;
GO

IF OBJECT_ID(N'dbo.hotel_reservations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.hotel_reservations
    (
        ReservationId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_hotel_reservations PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        RoomId      INT               NOT NULL,
        PartyId     INT               NULL,
        GuestName   NVARCHAR(200)     NOT NULL,
        GuestIdNo   NVARCHAR(50)      NULL,
        CheckInDate DATE              NOT NULL,
        CheckOutDate DATE             NULL,
        GuestsCount TINYINT           NULL,
        InvoiceId   BIGINT            NULL,
        Status      NVARCHAR(20)      NOT NULL CONSTRAINT DF_hotel_reservations_Status DEFAULT (N'booked'),
        Notes       NVARCHAR(300)     NULL,
        CONSTRAINT CK_hotel_reservations_Status CHECK (Status IN (N'booked', N'checked_in', N'checked_out', N'cancelled')),
        CONSTRAINT FK_hotel_reservations_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_hotel_reservations_rooms FOREIGN KEY (RoomId) REFERENCES dbo.hotel_rooms (RoomId),
        CONSTRAINT FK_hotel_reservations_parties FOREIGN KEY (PartyId) REFERENCES dbo.parties (PartyId),
        CONSTRAINT FK_hotel_reservations_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId)
    );
END;
GO

IF OBJECT_ID(N'dbo.doctors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.doctors
    (
        DoctorId   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_doctors PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        Code       NVARCHAR(20)      NOT NULL,
        NameAr     NVARCHAR(200)     NOT NULL,
        Specialty  NVARCHAR(120)     NULL,
        CommissionPct DECIMAL(9,4)   NOT NULL CONSTRAINT DF_doctors_Commission DEFAULT (0),
        AccountId  INT               NULL,
        IsActive   BIT               NOT NULL CONSTRAINT DF_doctors_IsActive DEFAULT (1),
        CONSTRAINT UQ_doctors_Company_Code UNIQUE (CompanyId, Code),
        CONSTRAINT CK_doctors_Commission CHECK (CommissionPct BETWEEN 0 AND 100),
        CONSTRAINT FK_doctors_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_doctors_accounts FOREIGN KEY (AccountId) REFERENCES dbo.accounts (AccountId)
    );
END;
GO

IF OBJECT_ID(N'dbo.medical_services', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.medical_services
    (
        ServiceId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_medical_services PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        Code       NVARCHAR(30)      NOT NULL,
        NameAr     NVARCHAR(200)     NOT NULL,
        ItemId     INT               NULL,
        Price      DECIMAL(18,4)     NOT NULL CONSTRAINT DF_medical_services_Price DEFAULT (0),
        DoctorId   INT               NULL,
        IsActive   BIT               NOT NULL CONSTRAINT DF_medical_services_IsActive DEFAULT (1),
        CONSTRAINT UQ_medical_services_Code UNIQUE (CompanyId, Code),
        CONSTRAINT FK_medical_services_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_medical_services_items FOREIGN KEY (ItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_medical_services_doctors FOREIGN KEY (DoctorId) REFERENCES dbo.doctors (DoctorId)
    );
END;
GO

IF OBJECT_ID(N'dbo.manufacturing_orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.manufacturing_orders
    (
        OrderId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_manufacturing_orders PRIMARY KEY,
        CompanyId   INT               NOT NULL,
        OrderNo     NVARCHAR(30)      NOT NULL,
        OrderDate   DATE              NOT NULL,
        ProductItemId INT             NOT NULL,
        Qty         DECIMAL(18,4)     NOT NULL,
        Status      NVARCHAR(20)      NOT NULL CONSTRAINT DF_manufacturing_orders_Status DEFAULT (N'draft'),
        WarehouseId INT               NULL,
        TotalCost   DECIMAL(18,4)     NOT NULL CONSTRAINT DF_manufacturing_orders_Cost DEFAULT (0),
        Notes       NVARCHAR(300)     NULL,
        CONSTRAINT UQ_manufacturing_orders_No UNIQUE (CompanyId, OrderNo),
        CONSTRAINT CK_manufacturing_orders_Status CHECK (Status IN (N'draft', N'in_progress', N'done', N'cancelled')),
        CONSTRAINT FK_manufacturing_orders_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_manufacturing_orders_items FOREIGN KEY (ProductItemId) REFERENCES dbo.items (ItemId),
        CONSTRAINT FK_manufacturing_orders_warehouses FOREIGN KEY (WarehouseId) REFERENCES dbo.warehouses (WarehouseId)
    );
END;
GO

IF OBJECT_ID(N'dbo.manufacturing_order_lines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.manufacturing_order_lines
    (
        OrderLineId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_manufacturing_order_lines PRIMARY KEY,
        OrderId     BIGINT            NOT NULL,
        ComponentItemId INT           NOT NULL,
        Qty         DECIMAL(18,4)     NOT NULL,
        UnitCost    DECIMAL(18,6)     NOT NULL CONSTRAINT DF_manufacturing_order_lines_Cost DEFAULT (0),
        StageName   NVARCHAR(80)      NULL,
        CONSTRAINT CK_manufacturing_order_lines_Qty CHECK (Qty > 0),
        CONSTRAINT FK_manufacturing_order_lines_orders FOREIGN KEY (OrderId) REFERENCES dbo.manufacturing_orders (OrderId),
        CONSTRAINT FK_manufacturing_order_lines_items FOREIGN KEY (ComponentItemId) REFERENCES dbo.items (ItemId)
    );
END;
GO

IF OBJECT_ID(N'dbo.meters', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.meters
    (
        MeterId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_meters PRIMARY KEY,
        CompanyId  INT               NOT NULL,
        MeterNo    NVARCHAR(40)      NOT NULL,
        MeterType  NVARCHAR(20)      NOT NULL CONSTRAINT DF_meters_Type DEFAULT (N'electric'),
        PartyId    INT               NULL,
        Address    NVARCHAR(200)     NULL,
        Tariff     DECIMAL(18,4)     NOT NULL CONSTRAINT DF_meters_Tariff DEFAULT (0),
        IsActive   BIT               NOT NULL CONSTRAINT DF_meters_IsActive DEFAULT (1),
        CONSTRAINT UQ_meters_No UNIQUE (CompanyId, MeterNo),
        CONSTRAINT CK_meters_Type CHECK (MeterType IN (N'electric', N'water', N'gas')),
        CONSTRAINT FK_meters_companies FOREIGN KEY (CompanyId) REFERENCES dbo.companies (CompanyId),
        CONSTRAINT FK_meters_parties FOREIGN KEY (PartyId) REFERENCES dbo.parties (PartyId)
    );
END;
GO

IF OBJECT_ID(N'dbo.meter_readings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.meter_readings
    (
        ReadingId  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_meter_readings PRIMARY KEY,
        MeterId    INT               NOT NULL,
        ReadingDate DATE             NOT NULL,
        PreviousValue DECIMAL(18,4)  NOT NULL CONSTRAINT DF_meter_readings_Prev DEFAULT (0),
        CurrentValue  DECIMAL(18,4)  NOT NULL,
        Consumption   AS (CurrentValue - PreviousValue) PERSISTED,
        Amount        DECIMAL(18,4)  NOT NULL CONSTRAINT DF_meter_readings_Amount DEFAULT (0),
        InvoiceId     BIGINT         NULL,
        CONSTRAINT UQ_meter_readings UNIQUE (MeterId, ReadingDate),
        CONSTRAINT FK_meter_readings_meters FOREIGN KEY (MeterId) REFERENCES dbo.meters (MeterId),
        CONSTRAINT FK_meter_readings_invoices FOREIGN KEY (InvoiceId) REFERENCES dbo.invoices (InvoiceId)
    );
END;
GO

INSERT INTO dbo.schema_migrations (MigrationId, AppliedBy)
SELECT N'65_verticals', SUSER_SNAME()
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE MigrationId = N'65_verticals');
GO
