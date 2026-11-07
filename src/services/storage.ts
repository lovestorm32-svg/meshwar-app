import {
  CityZone,
  Client,
  Complaint,
  Driver,
  NegotiationBid,
  NegotiationSettings,
  Trip,
  VehicleCategory,
  WalletTransaction,
  PaymentTopupMethod,
} from '../types';
import {
  INITIAL_CLIENT,
  INITIAL_CLIENTS_LIST,
  INITIAL_COMPLAINTS,
  INITIAL_DRIVERS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_TRIPS,
  INITIAL_ZONES,
  INITIAL_DEPARTMENTS,
  INITIAL_SUPPORT_OFFICERS,
} from '../data/mockData';
import { SupportDepartment, SupportOfficer, ComplaintLog } from '../types';

const STORAGE_KEYS = {
  DRIVERS: 'meshwar_drivers_v1',
  CLIENTS: 'meshwar_clients_v1',
  CURRENT_CLIENT: 'meshwar_curr_client_v1',
  CURRENT_DRIVER: 'meshwar_curr_driver_v1',
  TRIPS: 'meshwar_trips_v1',
  ACTIVE_TRIP: 'meshwar_active_trip_v1',
  SETTINGS: 'meshwar_settings_v1',
  ZONES: 'meshwar_zones_v1',
  TRANSACTIONS: 'meshwar_transactions_v1',
  COMPLAINTS: 'meshwar_complaints_v1',
  DEPARTMENTS: 'meshwar_departments_v1',
  OFFICERS: 'meshwar_officers_v1',
};

// Safe JSON helper
function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('meshwar_storage_update', { detail: { key } }));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

class MeshwarDataService {
  // Listeners
  private listeners: Set<() => void> = new Set();

  constructor() {
    window.addEventListener('storage', () => this.notify());
    window.addEventListener('meshwar_storage_update', () => this.notify());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- DRIVERS ---
  public getDrivers(): Driver[] {
    return load<Driver[]>(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
  }

  public setDrivers(drivers: Driver[]) {
    save(STORAGE_KEYS.DRIVERS, drivers);
  }

  public getDriverById(id: string): Driver | undefined {
    return this.getDrivers().find((d) => d.id === id);
  }

  public getCurrentDriver(): Driver {
    const drivers = this.getDrivers();
    const currentId = load<string>(STORAGE_KEYS.CURRENT_DRIVER, drivers[0]?.id || 'drv_1');
    return drivers.find((d) => d.id === currentId) || drivers[0];
  }

  public setCurrentDriverId(id: string) {
    save(STORAGE_KEYS.CURRENT_DRIVER, id);
    this.notify();
  }

  public updateDriver(updatedDriver: Driver) {
    const drivers = this.getDrivers().map((d) => (d.id === updatedDriver.id ? updatedDriver : d));
    this.setDrivers(drivers);
  }

  public updateDriverStatus(driverId: string, status: 'active' | 'suspended' | 'pending_verification') {
    const drivers = this.getDrivers().map((d) => (d.id === driverId ? { ...d, status } : d));
    this.setDrivers(drivers);
  }

  public toggleDriverOnline(driverId: string, isOnline: boolean) {
    const drivers = this.getDrivers().map((d) => (d.id === driverId ? { ...d, isOnline } : d));
    this.setDrivers(drivers);
  }

  public updateDriverDocument(
    driverId: string,
    documentId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    const drivers = this.getDrivers().map((d) => {
      if (d.id !== driverId) return d;
      const docs = d.documents.map((doc) =>
        doc.id === documentId ? { ...doc, status, rejectionReason } : doc
      );
      const allApproved = docs.every((doc) => doc.status === 'approved');
      return {
        ...d,
        documents: docs,
        status: allApproved ? ('active' as const) : d.status,
      };
    });
    this.setDrivers(drivers);
  }

  public approveAndActivateDriver(driverId: string) {
    const drivers = this.getDrivers().map((d) => {
      if (d.id !== driverId) return d;
      const docs = d.documents.map((doc) => ({
        ...doc,
        status: 'approved' as const,
        rejectionReason: undefined,
      }));
      return {
        ...d,
        documents: docs,
        status: 'active' as const,
      };
    });
    this.setDrivers(drivers);
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    return load<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS_LIST);
  }

  public getCurrentClient(): Client {
    return load<Client>(STORAGE_KEYS.CURRENT_CLIENT, INITIAL_CLIENT);
  }

  public setCurrentClient(client: Client) {
    save(STORAGE_KEYS.CURRENT_CLIENT, client);
    const clients = this.getClients().map((c) => (c.id === client.id ? client : c));
    save(STORAGE_KEYS.CLIENTS, clients);
  }

  public updateClientStatus(clientId: string, status: 'active' | 'blocked') {
    const clients = this.getClients().map((c) => (c.id === clientId ? { ...c, status } : c));
    save(STORAGE_KEYS.CLIENTS, clients);
  }

  public updateClientProfile(clientId: string, name: string, avatar: string, phone?: string) {
    const clients = this.getClients().map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          name: name.trim() || c.name,
          avatar: avatar.trim() || c.avatar,
          phone: phone?.trim() || c.phone,
        };
      }
      return c;
    });
    save(STORAGE_KEYS.CLIENTS, clients);

    const currClient = this.getCurrentClient();
    if (currClient.id === clientId) {
      save(STORAGE_KEYS.CURRENT_CLIENT, {
        ...currClient,
        name: name.trim() || currClient.name,
        avatar: avatar.trim() || currClient.avatar,
        phone: phone?.trim() || currClient.phone,
      });
    }
    this.notify();
  }

  // --- SETTINGS & ZONES ---
  public getSettings(): NegotiationSettings {
    return load<NegotiationSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public saveSettings(settings: NegotiationSettings) {
    save(STORAGE_KEYS.SETTINGS, settings);
  }

  public getZones(): CityZone[] {
    return load<CityZone>(STORAGE_KEYS.ZONES, INITIAL_ZONES as any) as unknown as CityZone[];
  }

  public saveZones(zones: CityZone[]) {
    save(STORAGE_KEYS.ZONES, zones);
  }

  // --- TRIPS & NEGOTIATION ---
  public getTrips(): Trip[] {
    return load<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
  }

  public getActiveTrip(): Trip | null {
    return load<Trip | null>(STORAGE_KEYS.ACTIVE_TRIP, null);
  }

  public setActiveTrip(trip: Trip | null) {
    save(STORAGE_KEYS.ACTIVE_TRIP, trip);
    if (trip) {
      const allTrips = this.getTrips();
      const existingIdx = allTrips.findIndex((t) => t.id === trip.id);
      if (existingIdx >= 0) {
        allTrips[existingIdx] = trip;
      } else {
        allTrips.unshift(trip);
      }
      save(STORAGE_KEYS.TRIPS, allTrips);
    }
    this.notify();
  }

  // Create new trip request by client
  public createTripRequest(tripData: {
    pickup: { name: string; address: string; lat: number; lng: number };
    dropoff: { name: string; address: string; lat: number; lng: number };
    distanceKm: number;
    estimatedMinutes: number;
    vehicleCategory: VehicleCategory;
    suggestedSystemPrice: number;
    clientInitialPrice: number;
    paymentMethod: 'cash';
    clientNotes?: string;
  }): Trip {
    const client = this.getCurrentClient();
    const settings = this.getSettings();

    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientAvatar: client.avatar,
      pickup: tripData.pickup,
      dropoff: tripData.dropoff,
      distanceKm: tripData.distanceKm,
      estimatedMinutes: tripData.estimatedMinutes,
      vehicleCategory: tripData.vehicleCategory,
      suggestedSystemPrice: tripData.suggestedSystemPrice,
      clientInitialPrice: tripData.clientInitialPrice,
      platformCommission: Math.round(
        (tripData.clientInitialPrice * settings.platformCommissionPercent) / 100
      ),
      paymentMethod: 'cash',
      clientNotes: tripData.clientNotes?.trim() || undefined,
      status: 'negotiating',
      bids: [],
      activeBidExpirySeconds: settings.biddingWindowSeconds,
      messages: [
        {
          id: `msg_${Date.now()}`,
          tripId: `trip_${Date.now()}`,
          senderId: 'system',
          senderType: 'system',
          senderName: 'مشوار بوت',
          text: 'تم نشر طلب المشوار بنجاح للكباتن القريبين منك، في انتظار عروض الأسعار...',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.setActiveTrip(newTrip);

    // Simulate smart driver bids from nearby drivers if in demo mode
    this.triggerSmartDriverResponses(newTrip);

    return newTrip;
  }

  // Driver counter-offer or accept initial price
  public submitDriverBid(tripId: string, driver: Driver, proposedPrice: number): NegotiationBid | null {
    const active = this.getActiveTrip();
    if (!active || active.id !== tripId || active.status !== 'negotiating') return null;

    const settings = this.getSettings();
    if (settings.preventBiddingBelowSuggested && proposedPrice < active.suggestedSystemPrice) {
      proposedPrice = active.suggestedSystemPrice;
    }
    if (proposedPrice < (settings.minTripFare || 20)) {
      proposedPrice = settings.minTripFare || 20;
    }

    const existingBid = active.bids.find((b) => b.driverId === driver.id);
    if (existingBid) {
      existingBid.proposedPrice = proposedPrice;
      existingBid.status = 'pending';
      this.setActiveTrip({ ...active });
      return existingBid;
    }

    const distanceToPickup = +(
      Math.sqrt(
        Math.pow(driver.currentLocation.lat - active.pickup.lat, 2) +
          Math.pow(driver.currentLocation.lng - active.pickup.lng, 2)
      ) * 111
    ).toFixed(1);

    const bid: NegotiationBid = {
      id: `bid_${Date.now()}_${driver.id}`,
      tripId,
      driverId: driver.id,
      driverName: driver.name,
      driverAvatar: driver.avatar,
      driverRating: driver.rating,
      vehicleModel: `${driver.vehicle.nameAr} - ${driver.vehicle.model}`,
      vehicleColor: driver.vehicle.color,
      plateNumber: driver.vehicle.plateNumber,
      driverDistanceKm: Math.max(0.4, distanceToPickup),
      estimatedArrivalMinutes: Math.max(2, Math.round(distanceToPickup * 2.5)),
      proposedPrice,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    active.bids.push(bid);
    this.setActiveTrip({ ...active });
    return bid;
  }

  // Smart simulated responses from active nearby drivers
  private triggerSmartDriverResponses(trip: Trip) {
    const drivers = this.getDrivers().filter(
      (d) => d.isOnline && d.status === 'active' && d.vehicle.category === trip.vehicleCategory
    );

    const candidates = drivers.length > 0 ? drivers : this.getDrivers().filter((d) => d.isOnline);

    candidates.slice(0, 3).forEach((driver, idx) => {
      setTimeout(() => {
        const currentActive = this.getActiveTrip();
        if (!currentActive || currentActive.id !== trip.id || currentActive.status !== 'negotiating') return;

        // No bidding below proposed/suggested price and minimum 20 EGP
        const settings = this.getSettings();
        const minAllowed = Math.max(settings.minTripFare || 20, trip.clientInitialPrice);
        let offer = minAllowed;
        if (idx === 1) offer = minAllowed + 10;
        if (idx === 2) offer = minAllowed + 20;

        this.submitDriverBid(trip.id, driver, offer);
      }, (idx + 1) * 2200);
    });
  }

  // Client accepts driver's bid
  public acceptBid(tripId: string, bidId: string): boolean {
    const active = this.getActiveTrip();
    if (!active || active.id !== tripId) return false;

    const bid = active.bids.find((b) => b.id === bidId);
    if (!bid) return false;

    const driver = this.getDriverById(bid.driverId);
    const settings = this.getSettings();

    const commission = Math.round((bid.proposedPrice * settings.platformCommissionPercent) / 100);
    const driverEarnings = bid.proposedPrice - commission;

    active.status = 'offer_accepted';
    active.driverId = bid.driverId;
    active.driverName = bid.driverName;
    active.driverAvatar = bid.driverAvatar;
    active.driverPhone = driver?.phone || '+201012345678';
    active.driverVehicle = driver?.vehicle;
    active.agreedPrice = bid.proposedPrice;
    active.platformCommission = commission;
    active.driverEarnings = driverEarnings;

    active.bids = active.bids.map((b) => ({
      ...b,
      status: b.id === bidId ? 'accepted' : 'rejected',
    }));

    active.messages.push({
      id: `msg_${Date.now()}`,
      tripId: active.id,
      senderId: 'system',
      senderType: 'system',
      senderName: 'مشوار',
      text: `مبروك! تم الاتفاق على السعر النهائي ${bid.proposedPrice} ج.م مع الكابتن ${bid.driverName}. الكابتن في طريقه إليك الآن.`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });

    this.setActiveTrip({ ...active });

    // Transition to driver arriving automatically
    setTimeout(() => {
      this.advanceTripStatus(active.id, 'driver_arriving');
    }, 1500);

    return true;
  }

  // Driver advances trip status
  public advanceTripStatus(
    tripId: string,
    newStatus: 'driver_arriving' | 'arrived_pickup' | 'in_trip' | 'completed' | 'cancelled',
    cancellationReason?: string,
    cancelledBy?: 'client' | 'driver' | 'admin'
  ) {
    const active = this.getActiveTrip();
    if (!active || active.id !== tripId) return;

    active.status = newStatus;

    if (newStatus === 'driver_arriving') {
      active.messages.push({
        id: `msg_${Date.now()}`,
        tripId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'مشوار',
        text: 'الكابتن يتحرك الآن باتجاه موقعك، يمكنك متابعته مباشرة على الخريطة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (newStatus === 'arrived_pickup') {
      active.messages.push({
        id: `msg_${Date.now()}`,
        tripId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'مشوار',
        text: 'وصل الكابتن إلى نقطة الركوب، يرجى التوجه إلى السيارة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (newStatus === 'in_trip') {
      active.startedAt = new Date().toISOString();
      active.messages.push({
        id: `msg_${Date.now()}`,
        tripId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'مشوار',
        text: 'بدأت الرحلة بحمد الله! نتمنى لك مشواراً آمناً وممتعاً.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (newStatus === 'completed') {
      active.completedAt = new Date().toISOString();
      active.messages.push({
        id: `msg_${Date.now()}`,
        tripId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'مشوار',
        text: `وصلت بالسلامة لوجهتك! إجمالي الأجرة المستحقة ${active.agreedPrice} ج.م (${active.paymentMethod === 'cash' ? 'كاش للكابتن' : 'خصم من المحفظة'}).`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });

      // Update Driver earnings and wallet
      if (active.driverId && active.agreedPrice) {
        const driver = this.getDriverById(active.driverId);
        if (driver) {
          const fare = active.agreedPrice;
          const comm = active.platformCommission;
          driver.walletBalance += active.paymentMethod === 'cash' ? -comm : fare - comm;
          driver.totalTrips += 1;
          this.updateDriver(driver);

          // Add transactions
          this.addTransaction({
            id: `tx_${Date.now()}_fare`,
            userId: driver.id,
            userType: 'driver',
            userName: driver.name,
            amount: active.driverEarnings || fare - comm,
            type: 'trip_fare',
            status: 'completed',
            createdAt: new Date().toISOString(),
            description: `أجرة الرحلة #${active.id.slice(-6)} إلى ${active.dropoff.name}`,
          });
        }
      }

      // Update Client trips
      const client = this.getCurrentClient();
      if (client.id === active.clientId) {
        client.totalTrips += 1;
        this.setCurrentClient(client);
      }
    } else if (newStatus === 'cancelled') {
      active.cancellationReason = cancellationReason;
      active.cancelledBy = cancelledBy;
      active.messages.push({
        id: `msg_${Date.now()}`,
        tripId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'مشوار',
        text: `تم إلغاء الرحلة بواسطة (${cancelledBy === 'client' ? 'العميل' : cancelledBy === 'driver' ? 'الكابتن' : 'الإدارة'}): ${cancellationReason || 'بدون سبب'}`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    this.setActiveTrip({ ...active });
  }

  // Send in-trip chat message
  public sendChatMessage(tripId: string, senderId: string, senderType: 'client' | 'driver', text: string) {
    const active = this.getActiveTrip();
    if (!active || active.id !== tripId) return;

    const senderName =
      senderType === 'client'
        ? active.clientName
        : active.driverName || 'الكابتن';

    const msg: any = {
      id: `msg_${Date.now()}`,
      tripId,
      senderId,
      senderType,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    active.messages.push(msg);
    this.setActiveTrip({ ...active });
  }

  // Rate trip (Client rates Driver)
  public rateTrip(tripId: string, rating: number, feedback?: string) {
    const active = this.getActiveTrip();
    if (active && active.id === tripId) {
      active.clientRating = rating;
      active.clientFeedback = feedback;
      this.setActiveTrip({ ...active });
    }

    const trips = this.getTrips().map((t) =>
      t.id === tripId ? { ...t, clientRating: rating, clientFeedback: feedback } : t
    );
    save(STORAGE_KEYS.TRIPS, trips);
    this.notify();
  }

  // Rate client (Driver rates Client)
  public rateClientByDriver(tripId: string, rating: number, feedback?: string) {
    const active = this.getActiveTrip();
    if (active && active.id === tripId) {
      active.driverRating = rating;
      active.driverFeedback = feedback;
      this.setActiveTrip({ ...active });
    }

    const trips = this.getTrips().map((t) =>
      t.id === tripId ? { ...t, driverRating: rating, driverFeedback: feedback } : t
    );
    save(STORAGE_KEYS.TRIPS, trips);
    this.notify();
  }

  // --- TRANSACTIONS ---
  public getTransactions(): WalletTransaction[] {
    return load<WalletTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  public addTransaction(tx: WalletTransaction) {
    const txs = this.getTransactions();
    txs.unshift(tx);
    save(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();
  }

  public requestDriverWithdrawal(
    driverId: string,
    amount: number,
    method: 'vodafone_cash' | 'instapay' | 'bank_transfer',
    accountDetails: string
  ): boolean {
    const driver = this.getDriverById(driverId);
    if (!driver || driver.walletBalance < amount) return false;

    driver.walletBalance -= amount;
    this.updateDriver(driver);

    this.addTransaction({
      id: `tx_w_${Date.now()}`,
      userId: driverId,
      userType: 'driver',
      userName: driver.name,
      amount: -amount,
      type: 'withdrawal',
      method,
      status: 'pending',
      referenceId: `${method.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      description: `طلب سحب أرباح عبر ${method === 'instapay' ? 'إنستاباي' : 'فودافون كاش'} (${accountDetails})`,
    });

    return true;
  }

  public approveWithdrawal(txId: string) {
    const txs = this.getTransactions().map((t) =>
      t.id === txId ? { ...t, status: 'completed' as const } : t
    );
    save(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();
  }

  // --- DRIVER BALANCE TOP-UP (شحن الرصيد فوري / محفظة إلكترونية) ---
  public topupDriverBalance(
    driverId: string,
    amount: number,
    method: PaymentTopupMethod,
    details: { fawryCode?: string; senderPhone?: string; referenceNumber?: string; notes?: string }
  ): boolean {
    const driver = this.getDriverById(driverId);
    if (!driver || amount <= 0) return false;

    driver.walletBalance += amount;
    this.updateDriver(driver);

    let methodLabel = 'فوري';
    if (method === 'vodafone_cash') methodLabel = 'فودافون كاش';
    else if (method === 'orange_cash') methodLabel = 'أورنج كاش';
    else if (method === 'etisalat_cash') methodLabel = 'إي آند اتصالات كاش';
    else if (method === 'we_pay') methodLabel = 'وي باي WE Pay';
    else if (method === 'instapay') methodLabel = 'إنستاباي InstaPay';

    const ref = details.referenceNumber || details.fawryCode || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    this.addTransaction({
      id: `tx_topup_${Date.now()}`,
      userId: driverId,
      userType: 'driver',
      userName: driver.name,
      amount,
      type: 'topup',
      method,
      status: 'completed',
      referenceId: ref,
      createdAt: new Date().toISOString(),
      description: `شحن رصيد المحفظة عبر ${methodLabel} (مرجع: ${ref})`,
    });

    return true;
  }

  // Admin or user edits driver balance (ويكون التعديل متاح)
  public updateDriverBalance(driverId: string, newBalance: number, reason: string = 'تعديل إداري للرصيد'): boolean {
    const driver = this.getDriverById(driverId);
    if (!driver) return false;

    const diff = newBalance - driver.walletBalance;
    driver.walletBalance = newBalance;
    this.updateDriver(driver);

    this.addTransaction({
      id: `tx_adj_${Date.now()}`,
      userId: driverId,
      userType: 'driver',
      userName: driver.name,
      amount: diff,
      type: diff >= 0 ? 'topup' : 'penalty',
      status: 'completed',
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      description: `${reason} - الرصيد الجديد: ${newBalance.toFixed(2)} ج.م`,
    });

    return true;
  }

  // --- COMPLAINTS, DEPARTMENTS & OFFICERS ---
  public getDepartments(): SupportDepartment[] {
    return load<SupportDepartment[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  public saveDepartments(depts: SupportDepartment[]) {
    save(STORAGE_KEYS.DEPARTMENTS, depts);
    this.notify();
  }

  public addDepartment(dept: SupportDepartment) {
    const depts = this.getDepartments();
    depts.push(dept);
    this.saveDepartments(depts);
  }

  public getSupportOfficers(): SupportOfficer[] {
    return load<SupportOfficer[]>(STORAGE_KEYS.OFFICERS, INITIAL_SUPPORT_OFFICERS);
  }

  public saveSupportOfficers(officers: SupportOfficer[]) {
    save(STORAGE_KEYS.OFFICERS, officers);
    this.notify();
  }

  public addSupportOfficer(officer: SupportOfficer) {
    const officers = this.getSupportOfficers();
    officers.unshift(officer);
    this.saveSupportOfficers(officers);
  }

  public updateSupportOfficer(updatedOfficer: SupportOfficer) {
    const officers = this.getSupportOfficers().map((o) =>
      o.id === updatedOfficer.id ? updatedOfficer : o
    );
    this.saveSupportOfficers(officers);
  }

  public getComplaints(): Complaint[] {
    return load<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  }

  public addComplaint(complaint: Complaint) {
    const cmps = this.getComplaints();
    cmps.unshift(complaint);
    save(STORAGE_KEYS.COMPLAINTS, cmps);
    this.notify();
  }

  // Assign complaint to a department and specific officer
  public assignComplaint(
    complaintId: string,
    officerId: string,
    departmentId?: string
  ): boolean {
    const officers = this.getSupportOfficers();
    const officer = officers.find((o) => o.id === officerId);
    if (!officer) return false;

    const depts = this.getDepartments();
    const dept = departmentId
      ? depts.find((d) => d.id === departmentId)
      : depts.find((d) => d.id === officer.departmentId);

    const cmps = this.getComplaints().map((c) => {
      if (c.id === complaintId) {
        const newLogs = c.logs ? [...c.logs] : [];
        newLogs.unshift({
          id: `log_${Date.now()}`,
          officerName: officer.name,
          action: 'إسناد الشكوى للمسؤول',
          note: `تم تعيين الشكوى لمتابعة: ${officer.name} (${dept?.nameAr || officer.departmentName})`,
          timestamp: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
        });

        return {
          ...c,
          assignedOfficerId: officer.id,
          assignedOfficerName: officer.name,
          departmentId: dept?.id || officer.departmentId,
          departmentName: dept?.nameAr || officer.departmentName,
          status: c.status === 'open' ? ('in_review' as const) : c.status,
          logs: newLogs,
        };
      }
      return c;
    });

    save(STORAGE_KEYS.COMPLAINTS, cmps);

    // Update officer assigned count
    const updatedOfficers = officers.map((o) =>
      o.id === officerId
        ? { ...o, assignedComplaintsCount: (o.assignedComplaintsCount || 0) + 1 }
        : o
    );
    save(STORAGE_KEYS.OFFICERS, updatedOfficers);

    this.notify();
    return true;
  }

  // Add a follow-up log/action by assigned officer
  public addComplaintFollowUp(
    complaintId: string,
    officerName: string,
    action: string,
    note: string,
    newStatus?: Complaint['status']
  ) {
    const cmps = this.getComplaints().map((c) => {
      if (c.id === complaintId) {
        const newLogs = c.logs ? [...c.logs] : [];
        newLogs.unshift({
          id: `log_${Date.now()}`,
          officerName,
          action,
          note,
          timestamp: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
        });

        return {
          ...c,
          status: newStatus || c.status,
          resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : c.resolvedAt,
          resolutionNotes: newStatus === 'resolved' ? note : c.resolutionNotes,
          logs: newLogs,
        };
      }
      return c;
    });

    save(STORAGE_KEYS.COMPLAINTS, cmps);
    this.notify();
  }

  public resolveComplaint(id: string, notes: string) {
    const cmps = this.getComplaints().map((c) =>
      c.id === id
        ? {
            ...c,
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString(),
            resolutionNotes: notes,
          }
        : c
    );
    save(STORAGE_KEYS.COMPLAINTS, cmps);
    this.notify();
  }

  // Reset demo data
  public resetToDefaults() {
    localStorage.clear();
    save(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    save(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS_LIST);
    save(STORAGE_KEYS.CURRENT_CLIENT, INITIAL_CLIENT);
    save(STORAGE_KEYS.CURRENT_DRIVER, INITIAL_DRIVERS[0].id);
    save(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    save(STORAGE_KEYS.ACTIVE_TRIP, null);
    save(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    save(STORAGE_KEYS.ZONES, INITIAL_ZONES);
    save(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    save(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    save(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    save(STORAGE_KEYS.OFFICERS, INITIAL_SUPPORT_OFFICERS);
    this.notify();
  }
}

export const meshwarStore = new MeshwarDataService();
